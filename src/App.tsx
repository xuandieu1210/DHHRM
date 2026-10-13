import React, { useState, useEffect, useRef } from 'react';
import { Employee } from './types/employee';
import { InterviewCandidate } from './types/recruitment';
import { EmployeeSalary } from './types/salary';
import { UserAccount, ROLE_DEFINITIONS } from './types/auth';
import { Sidebar } from './components/Sidebar';
import { Header, AppTab } from './components/Header';
import { CompanyBanner } from './components/CompanyBanner';
import { LaborBookTable } from './components/LaborBookTable';
import { SalaryManagement } from './components/SalaryManagement';
import { MonthlyTurnoverReport } from './components/MonthlyTurnoverReport';
import { RecruitmentManagement } from './components/RecruitmentManagement';
import { UserManagement } from './components/UserManagement';
import { LoginScreen } from './components/LoginScreen';
import { EmployeeModal } from './components/EmployeeModal';
import { EmployeeDetailDrawer } from './components/EmployeeDetailDrawer';
import { DashboardAnalytics } from './components/DashboardAnalytics';
import { ContractAlertsView } from './components/ContractAlertsModal';
import { PrintLaborBook } from './components/PrintLaborBook';
import { downloadLaborBookImportTemplate, exportLaborBookToExcel, importLaborBookFromExcel } from './utils/excel';
import { getContractExpiryStatus, getLocalDateString } from './utils/dateUtils';
import { createEmployeeId } from './utils/employeeIds';
import { getSession, loadAppData, login, logout, resetAppData, saveCollection, saveUsers } from './utils/dataApi';

export default function App() {
  // Users & Auth State
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployeesForExport, setFilteredEmployeesForExport] = useState<Employee[]>([]);
  const [candidates, setCandidates] = useState<InterviewCandidate[]>([]);
  const [salaries, setSalaries] = useState<EmployeeSalary[]>([]);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  const [activeTab, setActiveTab] = useState<AppTab>('table');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [themeStyle, setThemeStyle] = useState<'excel' | 'modern'>('excel');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      [
        'dh_textile_labor_book_employees_v1',
        'dh_textile_interview_candidates_v1',
        'dh_textile_salaries_v1',
        'dh_textile_users_v1',
        'dh_textile_current_user_v1',
      ].forEach((key) => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Could not clear old browser data', error);
    }
  }, []);

  // Restore the server session before loading any HR data.
  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      setDataError(null);
      setIsAuthReady(false);
      try {
        const { user } = await getSession();
        if (cancelled) return;
        if (user) {
          const data = await loadAppData();
          if (cancelled) return;
          setCurrentUser(user);
          setEmployees(data.employees);
          setCandidates(data.candidates);
          setSalaries(data.salaries);
          setUsers(data.users);
          setIsDataReady(true);
        }
      } catch (error) {
        console.error('Failed to restore the PostgreSQL session', error);
        if (!cancelled) {
          setDataError('Không thể kết nối máy chủ hoặc cơ sở dữ liệu. Hãy kiểm tra dịch vụ rồi thử lại.');
        }
      } finally {
        if (!cancelled) setIsAuthReady(true);
      }
    };

    void restoreSession();
    return () => { cancelled = true; };
  }, [loadAttempt]);

  // Persist application collections in PostgreSQL.
  useEffect(() => {
    if (!isDataReady || !currentUser || !['admin', 'hr_manager', 'recruiter'].includes(currentUser.role)) return;
    void saveCollection('employees', employees).catch((error) => {
      console.error('Failed to save employees', error);
      setDataError('Không thể lưu dữ liệu nhân viên vào PostgreSQL.');
    });
  }, [employees, isDataReady, currentUser]);

  useEffect(() => {
    if (!isDataReady || !currentUser || !['admin', 'hr_manager', 'recruiter'].includes(currentUser.role)) return;
    void saveCollection('candidates', candidates).catch((error) => {
      console.error('Failed to save candidates', error);
      setDataError('Không thể lưu dữ liệu ứng viên vào PostgreSQL.');
    });
  }, [candidates, isDataReady, currentUser]);

  useEffect(() => {
    if (!isDataReady || !currentUser || !['admin', 'hr_manager'].includes(currentUser.role)) return;
    void saveCollection('salaries', salaries).catch((error) => {
      console.error('Failed to save salaries', error);
      setDataError('Không thể lưu dữ liệu lương vào PostgreSQL.');
    });
  }, [salaries, isDataReady, currentUser]);

  // Toast notification
  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  // Auth & RBAC Permissions
  const permissions = currentUser
    ? ROLE_DEFINITIONS[currentUser.role]?.defaultPermissions
    : null;

  const canCreateEmployee = permissions?.canCreateEmployee ?? false;
  const canEditEmployee = permissions?.canEditEmployee ?? false;
  const canDeleteEmployee = permissions?.canDeleteEmployee ?? false;
  const canManageRecruitment = permissions?.canManageRecruitment ?? false;
  const canOnboardCandidate = permissions?.canOnboardCandidate ?? false;
  const canRenewContract = permissions?.canRenewContract ?? false;
  const canExportImport = permissions?.canExportImportExcel ?? false;
  const canManageUsers = permissions?.canManageUsers ?? false;
  const canViewSalary = permissions?.canViewSalary ?? false;
  const canViewMonthlyReport = permissions?.canViewMonthlyReport ?? false;
  const canManageSalary = permissions?.canManageSalary ?? false;

  // Auto redirect if activeTab is not permitted for current role
  useEffect(() => {
    if (activeTab === 'salary' && !canViewSalary) {
      setActiveTab('recruitment');
    }
    if (activeTab === 'users' && !canManageUsers) {
      setActiveTab('table');
    }
    if (activeTab === 'monthly' && !canViewMonthlyReport) {
      setActiveTab('table');
    }
  }, [currentUser?.role, canViewSalary, canManageUsers, canViewMonthlyReport, activeTab]);

  // Metrics
  const activeCount = employees.filter(e => !e.resignationDate).length;
  let expiredCount = 0;
  let warningCount = 0;

  employees.forEach(e => {
    const s = getContractExpiryStatus(e);
    if (s.status === 'expired') expiredCount++;
    if (s.status === 'warning') warningCount++;
  });

  const todayInterviews = candidates.filter(c => c.interviewDate === getLocalDateString()).length;

  // Auth Handlers
  const handleLogin = async (username: string, password: string) => {
    const { user } = await login(username, password);
    try {
      const data = await loadAppData();
      setCurrentUser(user);
      setEmployees(data.employees);
      setCandidates(data.candidates);
      setSalaries(data.salaries);
      setUsers(data.users);
      setIsDataReady(true);
      setDataError(null);
      showToast(`Xin chào, ${user.fullName} (${ROLE_DEFINITIONS[user.role].nameVi})`);
    } catch (error) {
      await logout();
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to end server session', error);
      setDataError('Không thể kết thúc phiên đăng nhập. Hãy thử lại.');
      return;
    }
    setCurrentUser(null);
    setEmployees([]);
    setCandidates([]);
    setSalaries([]);
    setUsers([]);
    setIsDataReady(false);
    showToast('Đã đăng xuất khỏi hệ thống');
  };

  // User Management Handlers
  const handleSaveUser = (userToSave: UserAccount, password: string) => {
    const exists = users.some(u => u.id === userToSave.id);
    const nextUsers = exists
      ? users.map(user => user.id === userToSave.id ? userToSave : user)
      : [userToSave, ...users];
    void saveUsers(nextUsers, userToSave.id, password).then(() => {
      setUsers(nextUsers);
      if (currentUser?.id === userToSave.id) {
        setCurrentUser(userToSave);
      }
    }).catch((error) => {
      console.error('Failed to save users', error);
      setDataError('Không thể lưu tài khoản vào PostgreSQL.');
    });
    showToast(`Đã lưu tài khoản ${userToSave.fullName} (@${userToSave.username})`);
  };

  const handleDeleteUser = (userId: string) => {
    const nextUsers = users.filter(user => user.id !== userId);
    void saveUsers(nextUsers).then(() => setUsers(nextUsers)).catch((error) => {
      console.error('Failed to delete user', error);
      setDataError('Không thể xóa tài khoản khỏi PostgreSQL.');
    });
    showToast('Đã xóa tài khoản người dùng');
  };

  const handleToggleUserStatus = (userId: string) => {
    const nextUsers = users.map(user => user.id === userId
      ? { ...user, isActive: !user.isActive }
      : user);
    void saveUsers(nextUsers).then(() => setUsers(nextUsers)).catch((error) => {
      console.error('Failed to update user status', error);
      setDataError('Không thể cập nhật tài khoản trong PostgreSQL.');
    });
    showToast('Đã thay đổi trạng thái kích hoạt tài khoản');
  };

  // Salary Handlers
  const handleSaveSalary = (salaryToSave: EmployeeSalary) => {
    setSalaries(prev => {
      const exists = prev.some(s => s.id === salaryToSave.id);
      if (exists) {
        return prev.map(s => (s.id === salaryToSave.id ? salaryToSave : s));
      } else {
        return [salaryToSave, ...prev];
      }
    });

    if (salaryToSave.houseSubsidy > 0) {
      setEmployees(prev =>
        prev.map(emp => {
          if (emp.employeeId === salaryToSave.employeeId) {
            return {
              ...emp,
              houseSubsidy: `${salaryToSave.houseSubsidy.toLocaleString('en-US')} ${salaryToSave.currency}`
            };
          }
          return emp;
        })
      );
    }

    showToast(`Đã cập nhật biểu lương của ${salaryToSave.fullName} (${salaryToSave.employeeId})`);
  };

  const handleDeleteSalary = (salaryId: string) => {
    setSalaries(prev => prev.filter(s => s.id !== salaryId));
    showToast('Đã xóa biểu lương');
  };

  const handleImportSalaries = (importedSalaries: EmployeeSalary[]) => {
    if (!canManageSalary) {
      showToast('Bạn không có quyền nhập bảng lương.');
      return;
    }

    setSalaries(prev => {
      const next = [...prev];
      importedSalaries.forEach(imported => {
        const existingIndex = next.findIndex(salary =>
          salary.employeeId === imported.employeeId && salary.effectiveDate === imported.effectiveDate
        );
        if (existingIndex >= 0) next[existingIndex] = imported;
        else next.unshift(imported);
      });
      return next;
    });

    const housingByEmployee = new Map(
      importedSalaries
        .filter(salary => salary.houseSubsidy > 0)
        .map(salary => [salary.employeeId, salary])
    );
    if (housingByEmployee.size > 0) {
      setEmployees(prev => prev.map(employee => {
        const salary = housingByEmployee.get(employee.employeeId);
        return salary
          ? { ...employee, houseSubsidy: `${salary.houseSubsidy.toLocaleString('en-US')} ${salary.currency}` }
          : employee;
      }));
    }
    showToast(`Đã nhập ${importedSalaries.length} biểu lương.`);
  };

  // Employee Handlers
  const handleAddNew = () => {
    if (!canCreateEmployee) {
      showToast('Bạn không có quyền thêm mới nhân viên.');
      return;
    }
    setEditingEmployee(null);
    setIsModalOpen(true);
  };

  const handleEdit = (emp: Employee) => {
    if (!canEditEmployee) {
      showToast('Bạn không có quyền chỉnh sửa hồ sơ nhân viên.');
      return;
    }
    setEditingEmployee(emp);
    setIsModalOpen(true);
    setViewingEmployee(null);
  };

  const handleDelete = (emp: Employee) => {
    if (!canDeleteEmployee) {
      showToast('Bạn không có quyền xóa hồ sơ nhân viên.');
      return;
    }
    if (window.confirm(`Bạn có chắc chắn muốn xóa nhân viên "${emp.fullName}" (${emp.employeeId}) khỏi Sổ Quản Lý Lao Động không?`)) {
      setEmployees(prev => {
        const next = prev.filter(e => e.id !== emp.id);
        return next.map((item, idx) => ({ ...item, stt: idx + 1 }));
      });
      showToast(`Đã xóa nhân viên ${emp.fullName}`);
    }
  };

  const handleSaveEmployee = (empToSave: Employee) => {
    const previousEmployeeId = editingEmployee?.id === empToSave.id
      ? editingEmployee.employeeId
      : null;
    setEmployees(prev => {
      const exists = prev.some(e => e.id === empToSave.id);
      if (exists) {
        return prev.map(e => (e.id === empToSave.id ? empToSave : e));
      } else {
        const next = [...prev, empToSave];
        return next.map((item, idx) => ({ ...item, stt: idx + 1 }));
      }
    });
    if (previousEmployeeId && previousEmployeeId !== empToSave.employeeId) {
      setSalaries(prev => prev.map(salary => salary.employeeId === previousEmployeeId
        ? {
          ...salary,
          employeeId: empToSave.employeeId,
          fullName: empToSave.fullName,
          department: empToSave.department,
          position: empToSave.position
        }
        : salary));
    }
    setIsModalOpen(false);
    setEditingEmployee(null);
    showToast(editingEmployee ? `Đã cập nhật hồ sơ ${empToSave.fullName}` : `Đã thêm ${empToSave.fullName} vào sổ lao động`);
  };

  const handleRenewContract = (emp: Employee) => {
    if (!canRenewContract) {
      showToast('Bạn không có quyền thực hiện tái ký hoặc gia hạn hợp đồng.');
      return;
    }
    const updated: Employee = {
      ...emp,
      contractType: emp.contractType === '1 year' ? '2 years' : 'Không xác định thời hạn',
      contract1StartDate: emp.contract2EndDate || emp.contract1EndDate || '2026-10-10',
      contract1EndDate: '2028-10-09',
      contract2EndDate: ''
    };
    setEditingEmployee(updated);
    setIsModalOpen(true);
  };

  const handleExportExcel = () => {
    if (!canExportImport) {
      showToast('Bạn không có quyền xuất dữ liệu Excel.');
      return;
    }
    exportLaborBookToExcel(filteredEmployeesForExport);
    showToast('Đã xuất file Excel Sổ Quản Lý Lao Động thành công!');
  };

  const handleDownloadLaborTemplate = () => {
    downloadLaborBookImportTemplate();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canExportImport) {
      showToast('Bạn không có quyền nhập file Excel.');
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imported = await importLaborBookFromExcel(file, employees);
      if (imported.length > 0) {
        const importRecords = canViewSalary
          ? imported
          : imported.map(({ houseSubsidy: _houseSubsidy, ...employee }) => employee);
        const mergedEmployees = new Map(
          employees.map(employee => [employee.employeeId.trim().toLowerCase(), employee])
        );
        let updatedCount = 0;
        let addedCount = 0;

        importRecords.forEach(item => {
          const employeeKey = item.employeeId.trim().toLowerCase();
          const existing = mergedEmployees.get(employeeKey);
          if (existing) {
            mergedEmployees.set(employeeKey, {
              ...existing,
              ...item,
              id: existing.id,
              resignationDate: item.resignationDate?.trim() ? item.resignationDate : existing.resignationDate || '',
              resignationReason: item.resignationReason?.trim() ? item.resignationReason : existing.resignationReason || ''
            });
            updatedCount += 1;
          } else {
            mergedEmployees.set(employeeKey, item);
            addedCount += 1;
          }
        });

        setEmployees(Array.from(mergedEmployees.values()).map((item, idx) => ({ ...item, stt: idx + 1 })));
        showToast(`Đã nhập ${imported.length} hồ sơ: cập nhật ${updatedCount}, thêm ${addedCount}; giữ nguyên nhân viên không có trong file.`);
      } else {
        alert('Không tìm thấy dữ liệu hợp lệ trong file Excel.');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi khi đọc file Excel. Vui lòng kiểm tra định dạng.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleResetData = async () => {
    if (currentUser?.role !== 'admin') {
      showToast('Chỉ Quản trị viên (Admin) mới có quyền khôi phục dữ liệu gốc.');
      return;
    }
    if (window.confirm('Khôi phục danh sách lao động về dữ liệu mẫu gốc ban đầu của DH Textile?')) {
      try {
        await resetAppData();
        const data = await loadAppData();
        setEmployees(data.employees);
        setCandidates(data.candidates);
        setSalaries(data.salaries);
        showToast('Đã khôi phục dữ liệu mẫu ban đầu');
      } catch (error) {
        console.error('Failed to reset PostgreSQL data', error);
        setDataError('Không thể khôi phục dữ liệu trong PostgreSQL.');
      }
    }
  };

  // Candidate Handlers
  const handleSaveCandidate = (candToSave: InterviewCandidate) => {
    setCandidates(prev => {
      const exists = prev.some(c => c.id === candToSave.id);
      if (exists) {
        return prev.map(c => (c.id === candToSave.id ? candToSave : c));
      } else {
        return [candToSave, ...prev];
      }
    });
    showToast(`Đã lưu lịch hẹn PV ứng viên ${candToSave.fullName}`);
  };

  const handleDeleteCandidate = (candId: string) => {
    setCandidates(prev => prev.filter(c => c.id !== candId));
    showToast('Đã xóa lịch hẹn phỏng vấn');
  };

  const handleImportCandidates = (newCandidates: InterviewCandidate[]) => {
    setCandidates(prev => [...newCandidates, ...prev]);
    showToast(`Đã nhập ${newCandidates.length} ứng viên phỏng vấn từ file Excel!`);
  };

  // 1-Click Onboarding from Interview into Labor Book
  const handleConvertToEmployee = (candidate: InterviewCandidate) => {
    if (!canOnboardCandidate) {
      showToast('Chỉ Quản trị viên hoặc Trưởng phòng Nhân sự mới có quyền tiếp nhận ứng viên vào Sổ LĐ.');
      return;
    }

    const nextStt = employees.length + 1;
    const newEmpId = createEmployeeId('DH', employees.map(employee => employee.employeeId));
    const onboardDate = candidate.onboardDate || '2026-10-15';

    const newEmp: Employee = {
      id: `emp-onboard-${Date.now()}`,
      stt: nextStt,
      fullName: candidate.fullName,
      gender: 'Male',
      employeeId: newEmpId,
      dateOfBirth: '2000-01-01',
      nationality: 'Việt Nam',
      ethnicity: 'Kinh',
      nativePlace: 'Quảng Nam',
      permanentAddress: 'Tam Kỳ, Quảng Nam',
      phoneNumber: candidate.phoneNumber,
      idCardNumber: '',
      oldIdCardNumber: '',
      idIssueDate: '',
      idIssuePlace: 'Cục CSQLHC về TTXH',
      educationDegree: candidate.degree || 'THPT',
      technicalProfession: candidate.position,
      rankLevel: candidate.position.toLowerCase().includes('kỹ sư') || candidate.position.toLowerCase().includes('chuyên viên') ? 'Staff' : 'Worker',
      workingArea: candidate.location || 'Xưởng sản xuất',
      position: candidate.position,
      department: candidate.department,
      contractType: '1 year',
      contract1StartDate: onboardDate,
      contract1EndDate: '2027-10-14',
      contract2EndDate: '',
      joiningDate: onboardDate,
      timeOfService: 0,
      resignationDate: '',
      resignationReason: '',
      houseSubsidy: '',
      remark: `Tuyển dụng từ phỏng vấn ngày ${candidate.interviewDate} (${candidate.interviewer})`
    };

    setEditingEmployee(newEmp);
    setIsModalOpen(true);

    setCandidates(prev =>
      prev.map(c => (c.id === candidate.id ? { ...c, isConvertedToEmployee: true, status: 'accepted' } : c))
    );
  };

  if (!isAuthReady || (currentUser && !isDataReady) || (dataError && !currentUser)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
        <div className="max-w-md text-center">
          <h1 className="text-lg font-bold text-slate-900">DHHRM</h1>
          <p className="mt-2 text-sm text-slate-600">
            {dataError || 'Đang kiểm tra phiên đăng nhập...'}
          </p>
          {dataError && (
            <button
              onClick={() => setLoadAttempt((attempt) => attempt + 1)}
              className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Thử kết nối lại
            </button>
          )}
        </div>
      </div>
    );
  }

  // If user is not logged in, show Login Screen
  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-100/70 flex font-sans text-slate-900">
      {/* Hidden file input for Excel upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportFile}
        accept=".xlsx,.xls,.csv"
        className="hidden"
      />

      {dataError && (
        <div className="fixed top-4 right-4 z-50 rounded-lg bg-rose-700 px-4 py-3 text-sm text-white shadow-lg">
          {dataError}
          <button onClick={() => setDataError(null)} className="ml-3 font-bold" aria-label="Đóng">
            ×
          </button>
        </div>
      )}

      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs sm:text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          {notification}
        </div>
      )}

      {/* 1. Left Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        warningCount={warningCount + expiredCount}
        todayInterviewCount={todayInterviews}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />

      {/* 2. Main Viewport Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header with Breadcrumbs and User Indicator */}
        <Header
          activeTab={activeTab}
          onAddNew={handleAddNew}
          currentUser={currentUser}
          canCreateEmployee={canCreateEmployee}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        {/* Company Official Banner (DH Textile Header) */}
        <CompanyBanner
          onExportExcel={handleExportExcel}
          onImportClick={() => fileInputRef.current?.click()}
          onDownloadImportTemplate={handleDownloadLaborTemplate}
          onPrint={() => setShowPrintModal(true)}
          onResetData={handleResetData}
          totalCount={employees.length}
          activeCount={activeCount}
          expiredCount={expiredCount}
          themeStyle={themeStyle}
          setThemeStyle={setThemeStyle}
          canExportImport={canExportImport}
          showLaborImportExport={activeTab === 'table'}
        />

        {/* Main Content Area */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-full">
          {/* Tab 1: Sổ Quản Lý Lao Động (30 cột gốc) */}
          {activeTab === 'table' && (
            <LaborBookTable
              employees={employees}
              themeStyle={themeStyle}
              onViewEmployee={(emp) => setViewingEmployee(emp)}
              onEditEmployee={handleEdit}
              onDeleteEmployee={handleDelete}
              onFilteredEmployeesChange={setFilteredEmployeesForExport}
              canEditEmployee={canEditEmployee}
              canDeleteEmployee={canDeleteEmployee}
              canViewSalary={canViewSalary}
            />
          )}

          {/* Tab 2: Quản lý Lương & Phụ cấp */}
          {activeTab === 'salary' && (
            canViewSalary ? (
              <SalaryManagement
                salaries={salaries}
                employees={employees}
                onSaveSalary={handleSaveSalary}
                onImportSalaries={handleImportSalaries}
                onDeleteSalary={handleDeleteSalary}
                canEditSalary={canManageSalary}
                canExportExcel={canExportImport}
              />
            ) : (
              <div className="bg-white p-8 rounded-2xl border border-rose-200 text-center max-w-md mx-auto my-12 shadow-sm space-y-3">
                <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-xl">
                  🔒
                </div>
                <h3 className="text-base font-bold text-slate-900">Không Có Quyền Xem Lương</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Tài khoản vai trò <strong>{currentUser ? ROLE_DEFINITIONS[currentUser.role]?.nameVi : ''}</strong> không có thẩm quyền truy cập phân hệ Lương và các khoản Phụ cấp của nhân viên.
                </p>
                <button
                  onClick={() => setActiveTab('recruitment')}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Quay lại Lịch PV &amp; Tuyển Dụng
                </button>
              </div>
            )
          )}

          {/* Tab 3: Thống kê nhân sự theo tháng & nhân sự nghỉ theo tháng */}
          {activeTab === 'monthly' && canViewMonthlyReport && (
            <MonthlyTurnoverReport
              employees={employees}
            />
          )}

          {/* Tab 4: Nhập danh sách hẹn phỏng vấn theo ngày & Thống kê tuyển dụng */}
          {activeTab === 'recruitment' && (
            <RecruitmentManagement
              candidates={candidates}
              onSaveCandidate={handleSaveCandidate}
              onDeleteCandidate={handleDeleteCandidate}
              onImportCandidates={handleImportCandidates}
              onConvertToEmployee={handleConvertToEmployee}
              canManageRecruitment={canManageRecruitment}
              canOnboardCandidate={canOnboardCandidate}
              canExportImport={canExportImport}
              canViewSalary={canViewSalary}
            />
          )}

          {/* Tab 5: Thống kê cơ cấu nhân sự tổng thể */}
          {activeTab === 'analytics' && (
            <DashboardAnalytics
              employees={employees}
            />
          )}

          {/* Tab 6: Cảnh báo hết hạn hợp đồng */}
          {activeTab === 'alerts' && (
            <ContractAlertsView
              employees={employees}
              onRenewContract={handleRenewContract}
              onViewEmployee={(emp) => setViewingEmployee(emp)}
            />
          )}

          {/* Tab 7: Quản lý người dùng & phân quyền (Chỉ Admin) */}
          {activeTab === 'users' && canManageUsers && (
            <UserManagement
              users={users}
              currentUser={currentUser}
              onSaveUser={handleSaveUser}
              onDeleteUser={handleDeleteUser}
              onToggleUserStatus={handleToggleUserStatus}
            />
          )}
        </main>

        {/* Add / Edit Employee Modal */}
        <EmployeeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveEmployee}
          initialData={editingEmployee}
          existingCount={employees.length}
          existingEmployeeIds={employees.map(employee => employee.employeeId)}
          canViewSalary={canViewSalary}
        />

        {/* Detail / Profile Drawer */}
        <EmployeeDetailDrawer
          employee={viewingEmployee}
          onClose={() => setViewingEmployee(null)}
          onEdit={handleEdit}
          canViewSalary={canViewSalary}
        />

        {/* Print Labor Book Preview Modal */}
        {showPrintModal && (
          <PrintLaborBook
            employees={employees}
            onClose={() => setShowPrintModal(false)}
          />
        )}

        {/* Standard Quiet Enterprise Footer */}
        <footer className="bg-white border-t border-slate-200 mt-auto py-4 text-center text-xs text-slate-500">
          <div className="px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>
              © 2026 <strong>Công ty TNHH DH Textile</strong>. Hệ thống Sổ Quản Lý Lao Động Doanh Nghiệp.
            </div>
            <div className="text-[11px] text-slate-400">
              KCN Tam Thăng, phường Bàn Thạch, TP Đà Nẵng · Phòng Nhân sự &amp; Hành chính
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
