import React, { useState, useEffect, useRef } from 'react';
import { Employee } from './types/employee';
import { INITIAL_EMPLOYEES } from './data/initialEmployees';
import { InterviewCandidate } from './types/recruitment';
import { INITIAL_INTERVIEWS } from './data/initialRecruitment';
import { EmployeeSalary } from './types/salary';
import { INITIAL_SALARIES } from './data/initialSalaries';
import { UserAccount, ROLE_DEFINITIONS } from './types/auth';
import { INITIAL_USERS } from './data/initialUsers';
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
import { exportLaborBookToExcel, importLaborBookFromExcel } from './utils/excel';
import { getContractExpiryStatus } from './utils/dateUtils';

const STORAGE_EMPLOYEES_KEY = 'dh_textile_labor_book_employees_v1';
const STORAGE_CANDIDATES_KEY = 'dh_textile_interview_candidates_v1';
const STORAGE_SALARIES_KEY = 'dh_textile_salaries_v1';
const STORAGE_USERS_KEY = 'dh_textile_users_v1';
const STORAGE_CURRENT_USER_KEY = 'dh_textile_current_user_v1';

export default function App() {
  // Users & Auth State
  const [users, setUsers] = useState<UserAccount[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_USERS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to parse users', e);
    }
    return INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_CURRENT_USER_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to parse current user', e);
    }
    return INITIAL_USERS[0]; // Default to admin for seamless first load
  });

  // Employees State
  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_EMPLOYEES_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to parse stored employees', e);
    }
    return INITIAL_EMPLOYEES;
  });

  // Recruitment Candidates State
  const [candidates, setCandidates] = useState<InterviewCandidate[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_CANDIDATES_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to parse stored candidates', e);
    }
    return INITIAL_INTERVIEWS;
  });

  // Salaries State
  const [salaries, setSalaries] = useState<EmployeeSalary[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_SALARIES_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to parse stored salaries', e);
    }
    return INITIAL_SALARIES;
  });

  const [activeTab, setActiveTab] = useState<AppTab>('table');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [themeStyle, setThemeStyle] = useState<'excel' | 'modern'>('excel');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persistence
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_EMPLOYEES_KEY, JSON.stringify(employees));
    } catch (e) {
      console.error('Failed to save employees', e);
    }
  }, [employees]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CANDIDATES_KEY, JSON.stringify(candidates));
    } catch (e) {
      console.error('Failed to save candidates', e);
    }
  }, [candidates]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SALARIES_KEY, JSON.stringify(salaries));
    } catch (e) {
      console.error('Failed to save salaries', e);
    }
  }, [salaries]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
    } catch (e) {
      console.error('Failed to save users', e);
    }
  }, [users]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
      }
    } catch (e) {
      console.error('Failed to save current user', e);
    }
  }, [currentUser]);

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
  const canManageSalary = permissions?.canManageSalary ?? false;

  // Auto redirect if activeTab is not permitted for current role
  useEffect(() => {
    if (activeTab === 'salary' && !canViewSalary) {
      setActiveTab('recruitment');
    }
    if (activeTab === 'users' && !canManageUsers) {
      setActiveTab('table');
    }
  }, [currentUser?.role, canViewSalary, canManageUsers, activeTab]);

  // Metrics
  const activeCount = employees.filter(e => !e.resignationDate).length;
  let expiredCount = 0;
  let warningCount = 0;

  employees.forEach(e => {
    const s = getContractExpiryStatus(e);
    if (s.status === 'expired') expiredCount++;
    if (s.status === 'warning') warningCount++;
  });

  const todayInterviews = candidates.filter(c => c.interviewDate === '2026-10-09').length;

  // Auth Handlers
  const handleLogin = (user: UserAccount) => {
    const updated = {
      ...user,
      lastLogin: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    setCurrentUser(updated);
    setUsers(prev => prev.map(u => (u.id === user.id ? updated : u)));
    showToast(`Xin chào, ${user.fullName} (${ROLE_DEFINITIONS[user.role].nameVi})`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    showToast('Đã đăng xuất khỏi hệ thống');
  };

  // User Management Handlers
  const handleSaveUser = (userToSave: UserAccount) => {
    setUsers(prev => {
      const exists = prev.some(u => u.id === userToSave.id);
      if (exists) {
        return prev.map(u => (u.id === userToSave.id ? userToSave : u));
      } else {
        return [userToSave, ...prev];
      }
    });
    if (currentUser && currentUser.id === userToSave.id) {
      setCurrentUser(userToSave);
    }
    showToast(`Đã lưu tài khoản ${userToSave.fullName} (@${userToSave.username})`);
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    showToast('Đã xóa tài khoản người dùng');
  };

  const handleToggleUserStatus = (userId: string) => {
    setUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, isActive: !u.isActive } : u))
    );
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
    setEmployees(prev => {
      const exists = prev.some(e => e.id === empToSave.id);
      if (exists) {
        return prev.map(e => (e.id === empToSave.id ? empToSave : e));
      } else {
        const next = [...prev, empToSave];
        return next.map((item, idx) => ({ ...item, stt: idx + 1 }));
      }
    });
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
    exportLaborBookToExcel(employees);
    showToast('Đã xuất file Excel Sổ Quản Lý Lao Động thành công!');
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canExportImport) {
      showToast('Bạn không có quyền nhập file Excel.');
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imported = await importLaborBookFromExcel(file);
      if (imported.length > 0) {
        setEmployees(imported.map((item, idx) => ({ ...item, stt: idx + 1 })));
        showToast(`Đã nhập thành công ${imported.length} lao động từ file Excel!`);
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

  const handleResetData = () => {
    if (currentUser?.role !== 'admin') {
      showToast('Chỉ Quản trị viên (Admin) mới có quyền khôi phục dữ liệu gốc.');
      return;
    }
    if (window.confirm('Khôi phục danh sách lao động về dữ liệu mẫu gốc ban đầu của DH Textile?')) {
      setEmployees(INITIAL_EMPLOYEES);
      setCandidates(INITIAL_INTERVIEWS);
      setSalaries(INITIAL_SALARIES);
      showToast('Đã khôi phục dữ liệu mẫu ban đầu');
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
    const newEmpId = `DH${1000 + nextStt}`;
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

  // If user is not logged in, show Login Screen
  if (!currentUser) {
    return <LoginScreen users={users} onLogin={handleLogin} />;
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
          onPrint={() => setShowPrintModal(true)}
          onResetData={handleResetData}
          totalCount={employees.length}
          activeCount={activeCount}
          expiredCount={expiredCount}
          themeStyle={themeStyle}
          setThemeStyle={setThemeStyle}
          canExportImport={canExportImport}
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
          {activeTab === 'monthly' && (
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
            />
          )}

          {/* Tab 5: Thống kê cơ cấu nhân sự tổng thể */}
          {activeTab === 'analytics' && (
            <DashboardAnalytics
              employees={employees}
              onFilterDepartment={() => setActiveTab('table')}
              onFilterStatus={() => setActiveTab('table')}
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
              KCN Tam Thăng, TP Tam Kỳ, Tỉnh Quảng Nam · Phòng Nhân sự &amp; Hành chính
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
