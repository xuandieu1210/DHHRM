import React, { useState, useMemo, useRef } from 'react';
import { 
  Calendar, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  UserCheck, 
  AlertCircle, 
  Trash2, 
  Edit3, 
  UserPlus, 
  BarChart3, 
  TrendingUp, 
  Building2, 
  Briefcase, 
  Layers, 
  CalendarCheck,
  ChevronRight,
  Eye,
  FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { InterviewCandidate, InterviewStatus } from '../types/recruitment';
import { formatDateDisplay } from '../utils/dateUtils';
import { 
  getMonthlyRecruitmentStats, 
  getRecruitmentBreakdownByDept, 
  getRecruitmentBreakdownByPosition,
  exportMonthlyRecruitmentReportToExcel 
} from '../utils/recruitmentStats';

interface RecruitmentManagementProps {
  candidates: InterviewCandidate[];
  onSaveCandidate: (candidate: InterviewCandidate) => void;
  onDeleteCandidate: (id: string) => void;
  onImportCandidates: (newCandidates: InterviewCandidate[]) => void;
  onConvertToEmployee: (candidate: InterviewCandidate) => void;
  canManageRecruitment?: boolean;
  canOnboardCandidate?: boolean;
  canExportImport?: boolean;
  canViewSalary?: boolean;
}

export const RecruitmentManagement: React.FC<RecruitmentManagementProps> = ({
  candidates,
  onSaveCandidate,
  onDeleteCandidate,
  onImportCandidates,
  onConvertToEmployee,
  canManageRecruitment = true,
  canOnboardCandidate = true,
  canExportImport = true,
  canViewSalary = true
}) => {
  // Sub-tabs: 'schedule' (Lịch PV hàng ngày) or 'monthly_stats' (Thống kê theo tháng)
  const [activeSubTab, setActiveSubTab] = useState<'schedule' | 'monthly_stats'>('schedule');

  // Daily Schedule Filter States
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-09');
  const [dateFilterMode, setDateFilterMode] = useState<'specific' | 'all' | 'month'>('specific');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('2026-10');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Monthly Report Tab States
  const [reportYear, setReportYear] = useState<number>(2026);
  const [reportSelectedMonth, setReportSelectedMonth] = useState<number | 'all'>('all');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<InterviewCandidate | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<InterviewCandidate>>({
    interviewDate: '2026-10-09',
    interviewTime: '09:00',
    fullName: '',
    phoneNumber: '',
    email: '',
    position: 'Công nhân may',
    department: 'Production',
    interviewer: 'Phạm Thị Ánh Tuyết (Quản đốc)',
    location: 'Xưởng May 01',
    status: 'scheduled',
    experienceYears: 1,
    degree: 'THPT',
    expectedSalary: '8,000,000 VND',
    notes: '',
    rating: 0
  });

  // Extract unique departments
  const departments = useMemo(() => {
    const set = new Set(candidates.map(c => c.department).filter(Boolean));
    return Array.from(set);
  }, [candidates]);

  // Extract unique available months from candidates
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach(c => {
      if (c.interviewDate && c.interviewDate.length >= 7) {
        set.add(c.interviewDate.substring(0, 7));
      }
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [candidates]);

  // Filtered Candidates for Daily Schedule Tab
  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      // Date filter
      if (dateFilterMode === 'specific' && selectedDate) {
        if (c.interviewDate !== selectedDate) return false;
      } else if (dateFilterMode === 'month' && selectedMonthFilter) {
        if (!c.interviewDate || !c.interviewDate.startsWith(selectedMonthFilter)) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && c.status !== statusFilter) {
        return false;
      }

      // Dept filter
      if (deptFilter !== 'all' && c.department !== deptFilter) {
        return false;
      }

      // Search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const mName = c.fullName.toLowerCase().includes(term);
        const mPhone = c.phoneNumber.toLowerCase().includes(term);
        const mPos = c.position.toLowerCase().includes(term);
        const mInterviewer = c.interviewer.toLowerCase().includes(term);
        if (!mName && !mPhone && !mPos && !mInterviewer) return false;
      }

      return true;
    }).sort((a, b) => {
      // Sort by date then time
      if (a.interviewDate !== b.interviewDate) {
        return b.interviewDate.localeCompare(a.interviewDate);
      }
      return a.interviewTime.localeCompare(b.interviewTime);
    });
  }, [candidates, dateFilterMode, selectedDate, selectedMonthFilter, statusFilter, deptFilter, searchTerm]);

  // Overall Recruitment Analytics (based on all candidates)
  const totalInterviews = candidates.length;
  const attendedCount = candidates.filter(c => c.status !== 'scheduled' && c.status !== 'cancelled').length;
  const passedCount = candidates.filter(c => c.status === 'passed' || c.status === 'accepted').length;
  const acceptedCount = candidates.filter(c => c.status === 'accepted').length;
  const failedCount = candidates.filter(c => c.status === 'failed').length;
  const cancelledCount = candidates.filter(c => c.status === 'cancelled').length;

  const attendanceRate = totalInterviews > 0 ? ((attendedCount / (totalInterviews - candidates.filter(c => c.status === 'scheduled').length || 1)) * 100).toFixed(0) : '0';
  const passRate = attendedCount > 0 ? ((passedCount / attendedCount) * 100).toFixed(0) : '0';

  // Count candidates for today
  const todayCandidatesCount = useMemo(() => {
    return candidates.filter(c => c.interviewDate === '2026-10-09').length;
  }, [candidates]);

  // Monthly Recruitment Statistics for reportYear (12 months)
  const monthlyRecruitmentStats = useMemo(() => {
    return getMonthlyRecruitmentStats(candidates, reportYear);
  }, [candidates, reportYear]);

  // Aggregate stats for reportYear
  const yearSummary = useMemo(() => {
    let totScheduled = 0;
    let totAttended = 0;
    let totPassed = 0;
    let totAccepted = 0;
    let totFailed = 0;
    let totCancelled = 0;

    monthlyRecruitmentStats.forEach(s => {
      totScheduled += s.totalScheduled;
      totAttended += s.attendedCount;
      totPassed += s.passedCount;
      totAccepted += s.acceptedCount;
      totFailed += s.failedCount;
      totCancelled += s.cancelledCount;
    });

    const attRate = totScheduled > 0 ? ((totAttended / totScheduled) * 100).toFixed(1) : '0';
    const pRate = totAttended > 0 ? ((totPassed / totAttended) * 100).toFixed(1) : '0';
    const onbRate = totPassed > 0 ? ((totAccepted / totPassed) * 100).toFixed(1) : '0';

    return {
      totScheduled,
      totAttended,
      attRate,
      totPassed,
      pRate,
      totAccepted,
      onbRate,
      totFailed,
      totCancelled
    };
  }, [monthlyRecruitmentStats]);

  // Candidates for selected month in report tab (or all year if 'all')
  const reportCandidates = useMemo(() => {
    if (reportSelectedMonth === 'all') {
      return candidates.filter(c => c.interviewDate && c.interviewDate.startsWith(String(reportYear)));
    }
    const monthStr = reportSelectedMonth < 10 ? `0${reportSelectedMonth}` : `${reportSelectedMonth}`;
    const prefix = `${reportYear}-${monthStr}`;
    return candidates.filter(c => c.interviewDate && c.interviewDate.startsWith(prefix));
  }, [candidates, reportYear, reportSelectedMonth]);

  // Department and Position breakdown for current report candidates
  const deptBreakdown = useMemo(() => {
    return getRecruitmentBreakdownByDept(reportCandidates);
  }, [reportCandidates]);

  const posBreakdown = useMemo(() => {
    return getRecruitmentBreakdownByPosition(reportCandidates);
  }, [reportCandidates]);

  // Highest month for chart scaling
  const maxMonthlyScheduled = useMemo(() => {
    const maxVal = Math.max(...monthlyRecruitmentStats.map(s => s.totalScheduled), 1);
    return Math.max(maxVal, 6);
  }, [monthlyRecruitmentStats]);

  // Modal Handlers
  const handleOpenAdd = () => {
    setEditingCandidate(null);
    setFormData({
      interviewDate: selectedDate || '2026-10-09',
      interviewTime: '09:00',
      fullName: '',
      phoneNumber: '',
      email: '',
      position: 'Công nhân may',
      department: 'Production',
      interviewer: 'Phạm Thị Ánh Tuyết (Quản đốc)',
      location: 'Xưởng May 01',
      status: 'scheduled',
      experienceYears: 1,
      degree: 'THPT',
      expectedSalary: '8,000,000 VND',
      notes: '',
      rating: 0
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cand: InterviewCandidate) => {
    setEditingCandidate(cand);
    setFormData({ ...cand });
    setIsModalOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.interviewDate) return;

    const candidateToSave: InterviewCandidate = {
      id: editingCandidate?.id || `int-${Date.now()}`,
      interviewDate: formData.interviewDate || '2026-10-09',
      interviewTime: formData.interviewTime || '09:00',
      fullName: formData.fullName || '',
      phoneNumber: formData.phoneNumber || '',
      email: formData.email || '',
      position: formData.position || '',
      department: formData.department || '',
      interviewer: formData.interviewer || '',
      location: formData.location || '',
      status: (formData.status as InterviewStatus) || 'scheduled',
      experienceYears: formData.experienceYears || 0,
      degree: formData.degree || '',
      expectedSalary: formData.expectedSalary || '',
      notes: formData.notes || '',
      rating: formData.rating || 0,
      onboardDate: formData.onboardDate || '',
      isConvertedToEmployee: editingCandidate?.isConvertedToEmployee || false
    };

    onSaveCandidate(candidateToSave);
    setIsModalOpen(false);
  };

  const handleQuickStatusChange = (cand: InterviewCandidate, newStatus: InterviewStatus) => {
    onSaveCandidate({
      ...cand,
      status: newStatus
    });
  };

  // Export Daily Schedule to Excel
  const handleExportExcelDaily = () => {
    const exportData = candidates.map((c, i) => [
      i + 1,
      formatDateDisplay(c.interviewDate),
      c.interviewTime,
      c.fullName,
      c.phoneNumber,
      c.email || '',
      c.position,
      c.department,
      c.interviewer,
      c.location,
      c.status === 'scheduled' ? 'Chờ phỏng vấn'
        : c.status === 'interviewed' ? 'Đã PV - Chờ kết quả'
        : c.status === 'passed' ? 'Trúng tuyển'
        : c.status === 'accepted' ? 'Đã nhận việc'
        : c.status === 'failed' ? 'Không đạt'
        : 'Hủy hẹn',
      c.expectedSalary || '',
      c.notes || ''
    ]);

    const header = [
      ['DANH SÁCH HẸN PHỎNG VẤN & BÁO CÁO TUYỂN DỤNG - CÔNG TY TNHH DH TEXTILE'],
      [],
      ['STT', 'Ngày PV', 'Giờ PV', 'Họ và Tên', 'SĐT', 'Email', 'Vị trí ứng tuyển', 'Bộ phận', 'Người PV', 'Địa điểm', 'Kết quả PV', 'Lương đề xuất', 'Nhận xét']
    ];

    const ws = XLSX.utils.aoa_to_sheet([...header, ...exportData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Lich_Phong_Van');
    XLSX.writeFile(wb, 'Lich_Hen_Phong_Van_DH_Textile.xlsx');
  };

  // Export Monthly Recruitment Report to Excel
  const handleExportMonthlyReport = () => {
    exportMonthlyRecruitmentReportToExcel(monthlyRecruitmentStats, reportYear, candidates);
  };

  // Import from Excel
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        let headerRow = 0;
        for (let i = 0; i < Math.min(json.length, 10); i++) {
          const rowStr = (json[i] || []).join(' ').toLowerCase();
          if (rowStr.includes('họ và tên') || rowStr.includes('ứng viên') || rowStr.includes('ngày pv')) {
            headerRow = i;
            break;
          }
        }

        const newItems: InterviewCandidate[] = [];
        json.slice(headerRow + 1).forEach((r, idx) => {
          if (!r || (!r[3] && !r[1])) return;
          const name = String(r[3] || r[1] || '').trim();
          if (!name) return;

          newItems.push({
            id: `int-imp-${Date.now()}-${idx}`,
            interviewDate: String(r[1] || selectedDate || '2026-10-09'),
            interviewTime: String(r[2] || '09:00'),
            fullName: name,
            phoneNumber: String(r[4] || ''),
            email: String(r[5] || ''),
            position: String(r[6] || 'Công nhân'),
            department: String(r[7] || 'Production'),
            interviewer: String(r[8] || 'Trưởng bộ phận'),
            location: String(r[9] || 'Nhà máy'),
            status: 'scheduled',
            experienceYears: 1,
            notes: String(r[12] || '')
          });
        });

        if (newItems.length > 0) {
          onImportCandidates(newItems);
          alert(`Đã nhập thành công ${newItems.length} lịch hẹn phỏng vấn từ file Excel!`);
        }
      } catch (err) {
        console.error(err);
        alert('Lỗi khi đọc file Excel hẹn phỏng vấn.');
      }
    };
    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getStatusBadge = (status: InterviewStatus) => {
    switch (status) {
      case 'scheduled':
        return <span className="bg-sky-50 text-sky-700 font-semibold px-2 py-0.5 rounded text-[11px] inline-flex items-center gap-1"><Clock className="w-3 h-3" /> Chờ phỏng vấn</span>;
      case 'interviewed':
        return <span className="bg-purple-50 text-purple-700 font-semibold px-2 py-0.5 rounded text-[11px] inline-flex items-center gap-1">Đã PV - Chờ KQ</span>;
      case 'passed':
        return <span className="bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded text-[11px] inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Đạt phỏng vấn</span>;
      case 'accepted':
        return <span className="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded text-[11px] inline-flex items-center gap-1"><UserCheck className="w-3 h-3" /> Đã nhận việc</span>;
      case 'failed':
        return <span className="bg-rose-50 text-rose-700 font-semibold px-2 py-0.5 rounded text-[11px] inline-flex items-center gap-1"><XCircle className="w-3 h-3" /> Không đạt</span>;
      case 'cancelled':
        return <span className="bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded text-[11px] inline-flex items-center gap-1">Hủy hẹn / Vắng</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden file input for excel upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportExcel}
        accept=".xlsx,.xls,.csv"
        className="hidden"
      />

      {/* Sub-navigation Switcher between Daily Schedule and Monthly Statistics */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveSubTab('schedule')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'schedule'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <CalendarCheck className="w-4 h-4 text-indigo-600" />
            <span>Lịch Phỏng Vấn Hàng Ngày</span>
            {todayCandidatesCount > 0 && (
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full font-mono">
                {todayCandidatesCount} hôm nay
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('monthly_stats')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'monthly_stats'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>Thống Kê Tuyển Dụng Theo Tháng</span>
            <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full font-mono">
              12 Tháng
            </span>
          </button>
        </div>

        {/* Global Action Shortcut */}
        <div className="flex items-center gap-2 px-2">
          {activeSubTab === 'schedule' && canManageRecruitment && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Thêm Lịch Hẹn PV
            </button>
          )}

          {activeSubTab === 'monthly_stats' && (
            <button
              onClick={handleExportMonthlyReport}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Xuất Báo Cáo Tháng (Excel)
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: DAILY INTERVIEW SCHEDULE (LỊCH PHỎNG VẤN HÀNG NGÀY)               */}
      {/* ========================================================================= */}
      {activeSubTab === 'schedule' && (
        <div className="space-y-6">
          {/* Recruitment KPI Stats Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <div className="text-slate-500 text-[11px] font-medium">Tổng lịch hẹn PV</div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">{totalInterviews}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Ứng viên đăng ký</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <div className="text-sky-700 text-[11px] font-medium">Đã tham gia PV</div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-sky-700 mt-1 tabular-nums">{attendedCount}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Tỷ lệ đến: {attendanceRate}%</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <div className="text-emerald-700 text-[11px] font-medium">Trúng tuyển (Passed)</div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-700 mt-1 tabular-nums">{passedCount}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Tỷ lệ đỗ: {passRate}%</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <div className="text-indigo-700 text-[11px] font-medium">Đã nhận việc</div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-indigo-700 mt-1 tabular-nums">{acceptedCount}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Sẵn sàng Onboard</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <div className="text-rose-700 text-[11px] font-medium">Không đạt</div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-rose-700 mt-1 tabular-nums">{failedCount}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Chưa đáp ứng</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <div className="text-slate-500 text-[11px] font-medium">Hủy hẹn / Vắng mặt</div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-slate-600 mt-1 tabular-nums">{cancelledCount}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Không tham gia</div>
            </div>
          </div>

          {/* Date Picker & Filter Toolbar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Quick Date Filters */}
              <div className="flex items-center flex-wrap gap-2 text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1.5 mr-1">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  Ngày phỏng vấn:
                </span>

                <button
                  onClick={() => { setSelectedDate('2026-10-09'); setDateFilterMode('specific'); }}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                    dateFilterMode === 'specific' && selectedDate === '2026-10-09'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Hôm nay (09/10/2026)
                </button>

                <button
                  onClick={() => { setSelectedDate('2026-10-10'); setDateFilterMode('specific'); }}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                    dateFilterMode === 'specific' && selectedDate === '2026-10-10'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Ngày mai (10/10/2026)
                </button>

                <button
                  onClick={() => { setSelectedDate('2026-10-08'); setDateFilterMode('specific'); }}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                    dateFilterMode === 'specific' && selectedDate === '2026-10-08'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Hôm qua (08/10/2026)
                </button>

                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                  <span className="text-[11px] text-slate-500">Chọn ngày:</span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => { setSelectedDate(e.target.value); setDateFilterMode('specific'); }}
                    className="bg-transparent text-xs font-semibold text-slate-900 focus:outline-none"
                  />
                </div>

                {/* Filter by Month Dropdown */}
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                  <span className="text-[11px] text-slate-500">Xem cả tháng:</span>
                  <select
                    value={selectedMonthFilter}
                    onChange={(e) => {
                      setSelectedMonthFilter(e.target.value);
                      setDateFilterMode('month');
                    }}
                    className="bg-transparent text-xs font-semibold text-slate-900 focus:outline-none cursor-pointer"
                  >
                    {availableMonths.map(m => {
                      const [y, mon] = m.split('-');
                      return (
                        <option key={m} value={m}>Tháng {mon}/{y}</option>
                      );
                    })}
                  </select>
                </div>

                <button
                  onClick={() => setDateFilterMode('all')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                    dateFilterMode === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Tất cả các ngày
                </button>
              </div>

              {/* Action buttons: Excel Import/Export */}
              <div className="flex items-center gap-2 flex-wrap">
                {canExportImport && (
                  <>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Nhập Excel Hàng Loạt
                    </button>

                    <button
                      onClick={handleExportExcelDaily}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Xuất Excel
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Secondary Filter Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm theo Tên ứng viên, SĐT, Vị trí, Người PV..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none"
                >
                  <option value="all">Tất cả kết quả</option>
                  <option value="scheduled">Chờ phỏng vấn</option>
                  <option value="interviewed">Đã PV - Chờ kết quả</option>
                  <option value="passed">Trúng tuyển</option>
                  <option value="accepted">Đã nhận việc</option>
                  <option value="failed">Không đạt</option>
                  <option value="cancelled">Hủy hẹn / Vắng mặt</option>
                </select>

                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none"
                >
                  <option value="all">Tất cả bộ phận</option>
                  {departments.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                <span className="text-slate-500 font-medium ml-2">
                  Có <strong className="text-slate-900 font-mono">{filteredCandidates.length}</strong> ứng viên
                </span>
              </div>
            </div>
          </div>

          {/* Candidate List Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[11px] border-b border-slate-200 select-none">
                  <tr>
                    <th className="py-2.5 px-3 text-center">STT</th>
                    <th className="py-2.5 px-3">Ngày &amp; Giờ PV</th>
                    <th className="py-2.5 px-3">Họ và Tên Ứng Viên</th>
                    <th className="py-2.5 px-3">Liên hệ (SĐT / Email)</th>
                    <th className="py-2.5 px-3">Vị trí ứng tuyển</th>
                    <th className="py-2.5 px-3">Bộ phận</th>
                    <th className="py-2.5 px-3">Người PV &amp; Địa điểm</th>
                    <th className="py-2.5 px-3 text-center">Trạng Thái / Kết Quả</th>
                    <th className="py-2.5 px-3">Đánh giá &amp; Ghi chú</th>
                    <th className="py-2.5 px-3 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredCandidates.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-500">
                        <p className="font-semibold text-sm">Không có lịch hẹn phỏng vấn nào phù hợp bộ lọc.</p>
                        <p className="text-xs text-slate-400 mt-1">Bấm "+ Thêm Lịch Hẹn PV" để lên lịch hẹn mới hoặc chọn ngày khác.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredCandidates.map((cand, idx) => (
                      <tr key={cand.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* STT */}
                        <td className="py-2.5 px-3 text-center font-mono text-slate-500 font-medium">
                          {idx + 1}
                        </td>

                        {/* Ngày & Giờ */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="font-mono font-bold text-slate-900">{cand.interviewTime}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{formatDateDisplay(cand.interviewDate)}</div>
                        </td>

                        {/* Họ và tên */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="font-bold text-slate-900 text-sm">{cand.fullName}</div>
                          {cand.degree && (
                            <div className="text-[11px] text-slate-500">{cand.degree}</div>
                          )}
                        </td>

                        {/* Liên hệ */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="font-mono font-semibold text-slate-800">{cand.phoneNumber}</div>
                          {cand.email && (
                            <div className="text-[11px] text-slate-500">{cand.email}</div>
                          )}
                        </td>

                        {/* Vị trí */}
                        <td className="py-2.5 px-3 whitespace-nowrap font-semibold text-slate-800">
                          {cand.position}
                        </td>

                        {/* Bộ phận */}
                        <td className="py-2.5 px-3 whitespace-nowrap font-medium text-slate-700">
                          {cand.department}
                        </td>

                        {/* Người PV & Địa điểm */}
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-slate-800">{cand.interviewer}</div>
                          <div className="text-[11px] text-slate-500">{cand.location}</div>
                        </td>

                        {/* Kết quả PV */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          {getStatusBadge(cand.status)}

                          {canManageRecruitment && (
                            <div className="mt-1">
                              <select
                                value={cand.status}
                                onChange={(e) => handleQuickStatusChange(cand, e.target.value as InterviewStatus)}
                                className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded px-1.5 py-0.5 border border-slate-300 focus:outline-none cursor-pointer"
                              >
                                <option value="scheduled">Chờ PV</option>
                                <option value="interviewed">Đã PV</option>
                                <option value="passed">Đạt PV</option>
                                <option value="accepted">Nhận việc</option>
                                <option value="failed">Không đạt</option>
                                <option value="cancelled">Hủy hẹn</option>
                              </select>
                            </div>
                          )}
                        </td>

                        {/* Đánh giá / Ghi chú */}
                        <td className="py-2.5 px-3 max-w-[200px]">
                          <div className="truncate text-slate-700" title={cand.notes}>
                            {cand.notes || <span className="text-slate-400 italic">Chưa có nhận xét</span>}
                          </div>
                          {cand.expectedSalary && (
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              Lương: {cand.expectedSalary}
                            </div>
                          )}
                        </td>

                        {/* Thao tác */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* 1-Click Onboard to Labor Book if Passed/Accepted */}
                            {canOnboardCandidate && (cand.status === 'passed' || cand.status === 'accepted') && (
                              <button
                                onClick={() => onConvertToEmployee(cand)}
                                title="Tiếp nhận chính thức vào Sổ Quản Lý Lao Động"
                                className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors font-semibold flex items-center gap-1 text-[11px] cursor-pointer"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                                <span>Vào Sổ LĐ</span>
                              </button>
                            )}

                            {canManageRecruitment ? (
                              <>
                                <button
                                  onClick={() => handleOpenEdit(cand)}
                                  title="Sửa thông tin lịch hẹn"
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => {
                                    if (window.confirm(`Xóa lịch hẹn phỏng vấn của ứng viên ${cand.fullName}?`)) {
                                      onDeleteCandidate(cand.id);
                                    }
                                  }}
                                  title="Xóa ứng viên"
                                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">Chỉ xem</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: MONTHLY RECRUITMENT STATISTICS (BÁO CÁO THỐNG KÊ THEO THÁNG)        */}
      {/* ========================================================================= */}
      {activeSubTab === 'monthly_stats' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header Controls: Year Selector & Month Filter */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  Năm báo cáo:
                </span>
                <select
                  value={reportYear}
                  onChange={(e) => {
                    setReportYear(Number(e.target.value));
                    setReportSelectedMonth('all');
                  }}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
                >
                  <option value={2026}>Năm 2026</option>
                  <option value={2025}>Năm 2025</option>
                  <option value={2024}>Năm 2024</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Xem theo:</span>
                <select
                  value={reportSelectedMonth === 'all' ? 'all' : String(reportSelectedMonth)}
                  onChange={(e) => setReportSelectedMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="all">Toàn bộ 12 Tháng (Cả năm {reportYear})</option>
                  {monthlyRecruitmentStats.map(s => (
                    <option key={s.month} value={s.month}>
                      {s.monthLabel} ({s.totalScheduled} ứng viên - {s.passedCount} trúng tuyển)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">
                Đang hiển thị: <strong className="text-slate-900 font-mono">{reportCandidates.length}</strong> ứng viên trong kỳ
              </span>
            </div>
          </div>

          {/* 4 Summary KPI Cards for Year / Selected Period */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1 */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {reportSelectedMonth === 'all' ? `Tổng Lịch PV Năm ${reportYear}` : `Lịch PV Tháng ${reportSelectedMonth}/${reportYear}`}
              </div>
              <div className="text-3xl font-extrabold font-mono text-slate-900 mt-2">
                {reportSelectedMonth === 'all' ? yearSummary.totScheduled : reportCandidates.length}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                <span>Đã tham gia: <strong className="text-slate-800 font-mono">{reportSelectedMonth === 'all' ? yearSummary.totAttended : reportCandidates.filter(c => c.status !== 'scheduled' && c.status !== 'cancelled').length}</strong></span>
                <span className="text-sky-700 font-semibold">Đến PV: {reportSelectedMonth === 'all' ? yearSummary.attRate : (reportCandidates.length > 0 ? ((reportCandidates.filter(c => c.status !== 'scheduled' && c.status !== 'cancelled').length / reportCandidates.length) * 100).toFixed(0) : '0')}%</span>
              </div>
              <div className="absolute top-3 right-3 text-slate-200">
                <CalendarCheck className="w-8 h-8" />
              </div>
            </div>

            {/* KPI 2 */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden">
              <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                Ứng Viên Trúng Tuyển (Passed)
              </div>
              <div className="text-3xl font-extrabold font-mono text-emerald-700 mt-2">
                {reportSelectedMonth === 'all' ? yearSummary.totPassed : reportCandidates.filter(c => c.status === 'passed' || c.status === 'accepted').length}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                <span>Tỷ lệ đỗ phỏng vấn:</span>
                <span className="text-emerald-700 font-bold font-mono">
                  {reportSelectedMonth === 'all' ? yearSummary.pRate : (reportCandidates.filter(c => c.status !== 'scheduled' && c.status !== 'cancelled').length > 0 ? ((reportCandidates.filter(c => c.status === 'passed' || c.status === 'accepted').length / reportCandidates.filter(c => c.status !== 'scheduled' && c.status !== 'cancelled').length) * 100).toFixed(0) : '0')}%
                </span>
              </div>
              <div className="absolute top-3 right-3 text-emerald-100">
                <CheckCircle2 className="w-8 h-8" />
              </div>
            </div>

            {/* KPI 3 */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden">
              <div className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                Đã Nhận Việc (Onboarded)
              </div>
              <div className="text-3xl font-extrabold font-mono text-indigo-700 mt-2">
                {reportSelectedMonth === 'all' ? yearSummary.totAccepted : reportCandidates.filter(c => c.status === 'accepted').length}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                <span>Tỷ lệ chấp thuận việc:</span>
                <span className="text-indigo-700 font-bold font-mono">
                  {reportSelectedMonth === 'all' ? yearSummary.onbRate : (reportCandidates.filter(c => c.status === 'passed' || c.status === 'accepted').length > 0 ? ((reportCandidates.filter(c => c.status === 'accepted').length / reportCandidates.filter(c => c.status === 'passed' || c.status === 'accepted').length) * 100).toFixed(0) : '0')}%
                </span>
              </div>
              <div className="absolute top-3 right-3 text-indigo-100">
                <UserCheck className="w-8 h-8" />
              </div>
            </div>

            {/* KPI 4 */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden">
              <div className="text-xs font-bold text-rose-700 uppercase tracking-wider">
                Không Đạt &amp; Hủy Hẹn
              </div>
              <div className="text-3xl font-extrabold font-mono text-rose-700 mt-2">
                {reportSelectedMonth === 'all' ? (yearSummary.totFailed + yearSummary.totCancelled) : reportCandidates.filter(c => c.status === 'failed' || c.status === 'cancelled').length}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                <span>Không đạt: <strong className="text-rose-700 font-mono">{reportSelectedMonth === 'all' ? yearSummary.totFailed : reportCandidates.filter(c => c.status === 'failed').length}</strong></span>
                <span>Hủy/Vắng: <strong className="text-slate-600 font-mono">{reportSelectedMonth === 'all' ? yearSummary.totCancelled : reportCandidates.filter(c => c.status === 'cancelled').length}</strong></span>
              </div>
              <div className="absolute top-3 right-3 text-rose-100">
                <XCircle className="w-8 h-8" />
              </div>
            </div>
          </div>

          {/* 12-Month Bar Chart Trend Overview */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                  Biểu Đồ So Sánh Số Lượng Tuyển Dụng Qua 12 Tháng Năm {reportYear}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Theo dõi số lượng lịch hẹn phỏng vấn, số trúng tuyển và số ứng viên chính thức nhận việc.
                </p>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 text-xs font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-slate-300"></span>
                  <span className="text-slate-600">Tổng hẹn PV</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-emerald-500"></span>
                  <span className="text-emerald-800">Trúng tuyển</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-indigo-600"></span>
                  <span className="text-indigo-800">Đã nhận việc</span>
                </div>
              </div>
            </div>

            {/* Visual Bars Container */}
            <div className="grid grid-cols-12 gap-2 pt-6 pb-2 border-b border-slate-100 min-h-[180px] items-end">
              {monthlyRecruitmentStats.map(stat => {
                const isSelected = reportSelectedMonth === stat.month;
                const totalPct = (stat.totalScheduled / maxMonthlyScheduled) * 100;
                const passedPct = (stat.passedCount / maxMonthlyScheduled) * 100;
                const acceptedPct = (stat.acceptedCount / maxMonthlyScheduled) * 100;

                return (
                  <div
                    key={stat.month}
                    onClick={() => setReportSelectedMonth(stat.month === reportSelectedMonth ? 'all' : stat.month)}
                    className={`flex flex-col items-center group cursor-pointer transition-all p-1 rounded-lg ${
                      isSelected ? 'bg-indigo-50 ring-2 ring-indigo-500' : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Numbers hover / top */}
                    <div className="text-[10px] font-mono font-bold text-slate-600 mb-1 opacity-80 group-hover:opacity-100">
                      {stat.totalScheduled > 0 ? stat.totalScheduled : '-'}
                    </div>

                    {/* Multi-Bar Columns */}
                    <div className="w-full flex items-end justify-center gap-1 h-28">
                      {/* Bar 1: Total */}
                      <div
                        style={{ height: `${Math.max(totalPct, stat.totalScheduled > 0 ? 8 : 2)}%` }}
                        className={`w-2.5 rounded-t transition-all ${
                          stat.totalScheduled > 0 ? 'bg-slate-300 group-hover:bg-slate-400' : 'bg-slate-100'
                        }`}
                        title={`Tháng ${stat.month}: ${stat.totalScheduled} lịch hẹn`}
                      />

                      {/* Bar 2: Passed */}
                      <div
                        style={{ height: `${Math.max(passedPct, stat.passedCount > 0 ? 8 : 2)}%` }}
                        className={`w-2.5 rounded-t transition-all ${
                          stat.passedCount > 0 ? 'bg-emerald-500 group-hover:bg-emerald-600' : 'bg-slate-100'
                        }`}
                        title={`Tháng ${stat.month}: ${stat.passedCount} trúng tuyển`}
                      />

                      {/* Bar 3: Accepted */}
                      <div
                        style={{ height: `${Math.max(acceptedPct, stat.acceptedCount > 0 ? 8 : 2)}%` }}
                        className={`w-2.5 rounded-t transition-all ${
                          stat.acceptedCount > 0 ? 'bg-indigo-600 group-hover:bg-indigo-700' : 'bg-slate-100'
                        }`}
                        title={`Tháng ${stat.month}: ${stat.acceptedCount} nhận việc`}
                      />
                    </div>

                    {/* Month Label */}
                    <div className={`text-[11px] font-bold mt-2 font-mono ${
                      isSelected ? 'text-indigo-700 underline' : 'text-slate-600'
                    }`}>
                      T{stat.month}
                    </div>

                    {/* Pass rate pill */}
                    <div className="text-[9px] font-mono text-emerald-700 mt-0.5">
                      {stat.totalScheduled > 0 ? `${stat.passRate}%` : ''}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Master 12-Month Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  Bảng Thống Kê Chi Tiết Tuyển Dụng 12 Tháng Năm {reportYear}
                </h4>
                <p className="text-xs text-slate-500">
                  Nhấp vào từng dòng tháng để lọc xem danh sách ứng viên chi tiết bên dưới.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportMonthlyReport}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-white border border-emerald-300 hover:bg-emerald-50 rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Xuất File Excel (.xlsx)
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[11px] border-b border-slate-200 select-none">
                  <tr>
                    <th className="py-2.5 px-3 text-center">Tháng</th>
                    <th className="py-2.5 px-3 text-center">Hẹn Phỏng Vấn</th>
                    <th className="py-2.5 px-3 text-center">Đã Tham Gia</th>
                    <th className="py-2.5 px-3 text-center">Tỷ Lệ Đến (%)</th>
                    <th className="py-2.5 px-3 text-center text-emerald-700">Trúng Tuyển (Passed)</th>
                    <th className="py-2.5 px-3 text-center text-emerald-700">Tỷ Lệ Đỗ (%)</th>
                    <th className="py-2.5 px-3 text-center text-indigo-700">Nhận Việc (Accepted)</th>
                    <th className="py-2.5 px-3 text-center text-indigo-700">Tỷ Lệ Nhận Việc (%)</th>
                    <th className="py-2.5 px-3 text-center text-rose-700">Không Đạt</th>
                    <th className="py-2.5 px-3 text-center">Hủy Hẹn / Vắng</th>
                    <th className="py-2.5 px-3 text-center">Đánh Giá Tuyển Dụng</th>
                    <th className="py-2.5 px-3 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {monthlyRecruitmentStats.map((st) => {
                    const isSelected = reportSelectedMonth === st.month;
                    let evalBadge = <span className="text-slate-400 text-[10px]">Chưa có dữ liệu</span>;
                    if (st.totalScheduled > 0) {
                      if (st.onboardingRate >= 70 && st.passRate >= 60) {
                        evalBadge = <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded text-[10px]">Rất tốt (Đạt KPI)</span>;
                      } else if (st.passRate >= 50) {
                        evalBadge = <span className="bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded text-[10px]">Đạt chuẩn</span>;
                      } else {
                        evalBadge = <span className="bg-amber-50 text-amber-700 font-semibold px-2 py-0.5 rounded text-[10px]">Cần mở rộng nguồn</span>;
                      }
                    }

                    return (
                      <tr 
                        key={st.month}
                        onClick={() => setReportSelectedMonth(st.month === reportSelectedMonth ? 'all' : st.month)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-indigo-50/70 font-medium' : 'hover:bg-slate-50'
                        }`}
                      >
                        {/* Tháng */}
                        <td className="py-3 px-3 text-center font-bold font-mono text-slate-900 whitespace-nowrap">
                          {st.monthLabel}
                          {isSelected && (
                            <span className="ml-1 text-[10px] text-indigo-600 font-sans font-normal">(Đang chọn)</span>
                          )}
                        </td>

                        {/* Tổng hẹn */}
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-900 tabular-nums">
                          {st.totalScheduled}
                        </td>

                        {/* Tham gia */}
                        <td className="py-3 px-3 text-center font-mono font-semibold text-slate-800 tabular-nums">
                          {st.attendedCount}
                        </td>

                        {/* Tỷ lệ đến */}
                        <td className="py-3 px-3 text-center font-mono font-semibold text-slate-700 tabular-nums">
                          {st.totalScheduled > 0 ? `${st.attendanceRate}%` : '-'}
                        </td>

                        {/* Trúng tuyển */}
                        <td className="py-3 px-3 text-center font-mono font-bold text-emerald-700 tabular-nums bg-emerald-50/30">
                          {st.passedCount}
                        </td>

                        {/* Tỷ lệ đỗ */}
                        <td className="py-3 px-3 text-center font-mono font-semibold text-emerald-800 tabular-nums bg-emerald-50/30">
                          {st.attendedCount > 0 ? `${st.passRate}%` : '-'}
                        </td>

                        {/* Đã nhận việc */}
                        <td className="py-3 px-3 text-center font-mono font-bold text-indigo-700 tabular-nums bg-indigo-50/30">
                          {st.acceptedCount}
                        </td>

                        {/* Tỷ lệ nhận việc */}
                        <td className="py-3 px-3 text-center font-mono font-semibold text-indigo-800 tabular-nums bg-indigo-50/30">
                          {st.passedCount > 0 ? `${st.onboardingRate}%` : '-'}
                        </td>

                        {/* Không đạt */}
                        <td className="py-3 px-3 text-center font-mono text-rose-700 tabular-nums">
                          {st.failedCount}
                        </td>

                        {/* Hủy hẹn */}
                        <td className="py-3 px-3 text-center font-mono text-slate-500 tabular-nums">
                          {st.cancelledCount}
                        </td>

                        {/* Đánh giá */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {evalBadge}
                        </td>

                        {/* Thao tác */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setReportSelectedMonth(st.month);
                            }}
                            className="px-2 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors cursor-pointer"
                          >
                            Xem ứng viên ({st.candidates.length})
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Dòng TỔNG CỘNG CẢ NĂM */}
                  <tr className="bg-slate-900 text-white font-bold text-xs select-none">
                    <td className="py-3 px-3 text-center font-mono uppercase">
                      Cả Năm {reportYear}
                    </td>
                    <td className="py-3 px-3 text-center font-mono tabular-nums text-white text-sm">
                      {yearSummary.totScheduled}
                    </td>
                    <td className="py-3 px-3 text-center font-mono tabular-nums text-sky-300">
                      {yearSummary.totAttended}
                    </td>
                    <td className="py-3 px-3 text-center font-mono tabular-nums text-sky-300">
                      {yearSummary.attRate}%
                    </td>
                    <td className="py-3 px-3 text-center font-mono tabular-nums text-emerald-300 text-sm">
                      {yearSummary.totPassed}
                    </td>
                    <td className="py-3 px-3 text-center font-mono tabular-nums text-emerald-300">
                      {yearSummary.pRate}%
                    </td>
                    <td className="py-3 px-3 text-center font-mono tabular-nums text-indigo-300 text-sm">
                      {yearSummary.totAccepted}
                    </td>
                    <td className="py-3 px-3 text-center font-mono tabular-nums text-indigo-300">
                      {yearSummary.onbRate}%
                    </td>
                    <td className="py-3 px-3 text-center font-mono tabular-nums text-rose-300">
                      {yearSummary.totFailed}
                    </td>
                    <td className="py-3 px-3 text-center font-mono tabular-nums text-slate-300">
                      {yearSummary.totCancelled}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-300 text-[11px]">
                      Tổng hợp 12 tháng
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => setReportSelectedMonth('all')}
                        className="px-2 py-1 text-[11px] font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                      >
                        Xem tất cả
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Breakdown by Department & Position */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Phân theo Bộ phận */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                <Building2 className="w-4 h-4 text-indigo-600" />
                Cơ Cấu Tuyển Dụng Theo Bộ Phận ({reportSelectedMonth === 'all' ? `Cả Năm ${reportYear}` : `Tháng ${reportSelectedMonth}/${reportYear}`})
              </h4>

              <div className="space-y-3">
                {deptBreakdown.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">Không có dữ liệu trong kỳ đã chọn.</p>
                ) : (
                  deptBreakdown.map(item => (
                    <div key={item.name} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-1">
                        <span>{item.name}</span>
                        <span className="font-mono">{item.total} ứng viên ({item.passed} đỗ)</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden flex">
                        <div
                          style={{ width: `${(item.passed / (item.total || 1)) * 100}%` }}
                          className="bg-emerald-500 h-full"
                          title={`Trúng tuyển: ${item.passed}`}
                        />
                        <div
                          style={{ width: `${((item.total - item.passed) / (item.total || 1)) * 100}%` }}
                          className="bg-slate-300 h-full"
                          title={`Chưa trúng tuyển / Hủy: ${item.total - item.passed}`}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                        <span>Đã nhận việc: <strong className="text-indigo-700 font-mono">{item.accepted}</strong></span>
                        <span className="text-emerald-700 font-medium">Tỷ lệ đỗ: {item.passRate}%</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Phân theo Vị trí ứng tuyển */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                <Briefcase className="w-4 h-4 text-emerald-600" />
                Vị Trí Tuyển Dụng Nhiều Nhất ({reportSelectedMonth === 'all' ? `Cả Năm ${reportYear}` : `Tháng ${reportSelectedMonth}/${reportYear}`})
              </h4>

              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {posBreakdown.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">Không có dữ liệu trong kỳ đã chọn.</p>
                ) : (
                  posBreakdown.map((item, idx) => (
                    <div key={item.name} className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-lg text-xs transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px] shrink-0 font-mono">
                          {idx + 1}
                        </span>
                        <div className="truncate">
                          <div className="font-semibold text-slate-900 truncate">{item.name}</div>
                          <div className="text-[10px] text-slate-500">
                            {item.passed} trúng tuyển · {item.accepted} đã nhận việc
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 ml-2">
                        <div className="font-mono font-bold text-slate-900">{item.total} UV</div>
                        <div className="text-[10px] text-emerald-700 font-semibold">{item.passRate}% đỗ</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Drill-down Candidate Table for the Selected Month / Year */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-indigo-600" />
                  Danh Sách Ứng Viên Chi Tiết: {reportSelectedMonth === 'all' ? `Toàn Bộ Năm ${reportYear}` : `Tháng ${reportSelectedMonth}/${reportYear}`}
                </h4>
                <p className="text-xs text-slate-500">
                  Xem kết quả, tiếp nhận ứng viên trúng tuyển trực tiếp vào Sổ Quản Lý Lao Động.
                </p>
              </div>

              {reportSelectedMonth !== 'all' && (
                <button
                  onClick={() => setReportSelectedMonth('all')}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline cursor-pointer"
                >
                  Xem toàn bộ ứng viên cả năm
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[11px] border-b border-slate-200 select-none">
                  <tr>
                    <th className="py-2.5 px-3 text-center">STT</th>
                    <th className="py-2.5 px-3">Ngày &amp; Giờ PV</th>
                    <th className="py-2.5 px-3">Họ và Tên Ứng Viên</th>
                    <th className="py-2.5 px-3">SĐT / Email</th>
                    <th className="py-2.5 px-3">Vị Trí Ứng Tuyển</th>
                    <th className="py-2.5 px-3">Bộ Phận</th>
                    <th className="py-2.5 px-3">Người PV</th>
                    <th className="py-2.5 px-3 text-center">Kết Quả PV</th>
                    <th className="py-2.5 px-3">Ghi Chú Đánh Giá</th>
                    <th className="py-2.5 px-3 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {reportCandidates.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-500">
                        Không có ứng viên phỏng vấn nào trong tháng {reportSelectedMonth} năm {reportYear}.
                      </td>
                    </tr>
                  ) : (
                    reportCandidates.map((cand, idx) => (
                      <tr key={cand.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 text-center font-mono text-slate-500">{idx + 1}</td>
                        <td className="py-2.5 px-3 whitespace-nowrap font-mono">
                          <span className="font-bold text-slate-900">{cand.interviewTime}</span>
                          <span className="text-[11px] text-slate-500 ml-1.5">{formatDateDisplay(cand.interviewDate)}</span>
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">{cand.fullName}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-700 whitespace-nowrap">{cand.phoneNumber}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800 whitespace-nowrap">{cand.position}</td>
                        <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">{cand.department}</td>
                        <td className="py-2.5 px-3 text-slate-700">{cand.interviewer}</td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          {getStatusBadge(cand.status)}
                        </td>
                        <td className="py-2.5 px-3 max-w-[200px] truncate text-slate-600" title={cand.notes}>
                          {cand.notes || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            {canOnboardCandidate && (cand.status === 'passed' || cand.status === 'accepted') && (
                              <button
                                onClick={() => onConvertToEmployee(cand)}
                                title="Tiếp nhận vào Sổ Lao Động"
                                className="px-2 py-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <UserPlus className="w-3 h-3" />
                                Vào Sổ LĐ
                              </button>
                            )}

                            {canManageRecruitment && (
                              <button
                                onClick={() => {
                                  handleOpenEdit(cand);
                                  setActiveSubTab('schedule');
                                }}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                                title="Sửa thông tin"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT INTERVIEW SCHEDULE                                      */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingCandidate ? 'Cập Nhật Lịch Hẹn & Kết Quả Phỏng Vấn' : 'Thêm Lịch Hẹn Phỏng Vấn Mới'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bộ phận Tuyển Dụng &amp; Nhân Sự - Công ty TNHH DH Textile
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveForm} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Ngày PV */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Ngày phỏng vấn <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.interviewDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, interviewDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>

                {/* Giờ PV */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Giờ phỏng vấn <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.interviewTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, interviewTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono"
                  />
                </div>

                {/* Họ tên */}
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Họ và tên ứng viên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="VD: Trần Văn Mạnh"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none font-medium text-slate-900"
                  />
                </div>

                {/* SĐT */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Số điện thoại liên hệ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    placeholder="VD: 0905112233"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="VD: ungvien@gmail.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>

                {/* Vị trí ứng tuyển */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Vị trí ứng tuyển <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.position}
                    onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                    placeholder="VD: Công nhân may công nghiệp"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none font-medium"
                  />
                </div>

                {/* Bộ phận */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Bộ phận tuyển dụng <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  >
                    <option value="Production">Production (Sản xuất &amp; May)</option>
                    <option value="Maintenance">Maintenance (Cơ điện &amp; Bảo trì)</option>
                    <option value="QC & QA">QC &amp; QA (Quản lý chất lượng)</option>
                    <option value="Warehouse">Warehouse (Kho vận &amp; Logistics)</option>
                    <option value="HR & Admin">HR &amp; Admin (Nhân sự &amp; Hành chính)</option>
                    <option value="Accounting">Accounting (Kế toán &amp; Tài chính)</option>
                  </select>
                </div>

                {/* Người phỏng vấn */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Người phỏng vấn / Trưởng bộ phận
                  </label>
                  <input
                    type="text"
                    value={formData.interviewer}
                    onChange={(e) => setFormData(prev => ({ ...prev, interviewer: e.target.value }))}
                    placeholder="VD: Phạm Thị Ánh Tuyết (Quản đốc)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>

                {/* Địa điểm PV */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Địa điểm phỏng vấn
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="VD: Xưởng May 01 / Phòng họp 2"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>

                {/* Trình độ */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Trình độ học vấn
                  </label>
                  <input
                    type="text"
                    value={formData.degree}
                    onChange={(e) => setFormData(prev => ({ ...prev, degree: e.target.value }))}
                    placeholder="VD: THPT, Trung cấp nghề, Đại học..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>

                {/* Mức lương kỳ vọng */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Mức lương kỳ vọng
                  </label>
                  {canViewSalary ? (
                    <input
                      type="text"
                      value={formData.expectedSalary}
                      onChange={(e) => setFormData(prev => ({ ...prev, expectedSalary: e.target.value }))}
                      placeholder="VD: 8,500,000 VND"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono"
                    />
                  ) : (
                    <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-400 italic text-xs select-none">
                      🔒 Bảo mật (Recruiter không xem được lương)
                    </div>
                  )}
                </div>

                {/* Kết quả phỏng vấn */}
                <div className="sm:col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="block font-bold text-slate-900 mb-2">
                    Trạng Thái &amp; Kết Quả Phỏng Vấn
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { val: 'scheduled', label: 'Chờ phỏng vấn' },
                      { val: 'interviewed', label: 'Đã PV - Chờ KQ' },
                      { val: 'passed', label: 'Trúng tuyển (Passed)' },
                      { val: 'accepted', label: 'Đã nhận việc' },
                      { val: 'failed', label: 'Không đạt' },
                      { val: 'cancelled', label: 'Hủy hẹn / Vắng' }
                    ].map(st => (
                      <label
                        key={st.val}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                          formData.status === st.val
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="radio"
                          name="interviewStatus"
                          value={st.val}
                          checked={formData.status === st.val}
                          onChange={() => setFormData(prev => ({ ...prev, status: st.val as InterviewStatus }))}
                          className="hidden"
                        />
                        <span>{st.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Nhận xét đánh giá */}
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nhận xét, đánh giá chuyên môn &amp; tay nghề
                  </label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="VD: Đạt bài kiểm tra tay nghề máy may 1 kim, tác phong nghiêm túc..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg font-semibold transition-colors cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold transition-colors cursor-pointer"
                >
                  {editingCandidate ? 'Lưu Thay Đổi' : 'Tạo Lịch Hẹn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
