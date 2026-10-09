import * as XLSX from 'xlsx';
import { InterviewCandidate, MonthlyRecruitmentRecord } from '../types/recruitment';
import { formatDateDisplay } from './dateUtils';
import { COMPANY_INFO } from '../data/initialEmployees';

export function getMonthlyRecruitmentStats(candidates: InterviewCandidate[], year: number): MonthlyRecruitmentRecord[] {
  const records: MonthlyRecruitmentRecord[] = [];

  for (let m = 1; m <= 12; m++) {
    const monthStr = m < 10 ? `0${m}` : `${m}`;
    const prefix = `${year}-${monthStr}`;

    const monthCandidates = candidates.filter(c => {
      if (!c.interviewDate) return false;
      return c.interviewDate.startsWith(prefix);
    });

    const totalScheduled = monthCandidates.length;
    const attendedCount = monthCandidates.filter(c => c.status !== 'scheduled' && c.status !== 'cancelled').length;
    const passedCount = monthCandidates.filter(c => c.status === 'passed' || c.status === 'accepted').length;
    const acceptedCount = monthCandidates.filter(c => c.status === 'accepted').length;
    const failedCount = monthCandidates.filter(c => c.status === 'failed').length;
    const cancelledCount = monthCandidates.filter(c => c.status === 'cancelled').length;

    const attendanceRate = totalScheduled > 0 ? Number(((attendedCount / totalScheduled) * 100).toFixed(1)) : 0;
    const passRate = attendedCount > 0 ? Number(((passedCount / attendedCount) * 100).toFixed(1)) : 0;
    const onboardingRate = passedCount > 0 ? Number(((acceptedCount / passedCount) * 100).toFixed(1)) : 0;

    records.push({
      month: m,
      year,
      monthLabel: `Tháng ${m}`,
      totalScheduled,
      attendedCount,
      attendanceRate,
      passedCount,
      passRate,
      acceptedCount,
      onboardingRate,
      failedCount,
      cancelledCount,
      candidates: monthCandidates
    });
  }

  return records;
}

export interface RecruitmentBreakdownItem {
  name: string;
  total: number;
  attended: number;
  passed: number;
  accepted: number;
  failed: number;
  passRate: number;
}

export function getRecruitmentBreakdownByDept(candidates: InterviewCandidate[]): RecruitmentBreakdownItem[] {
  const map: Record<string, { total: number; attended: number; passed: number; accepted: number; failed: number }> = {};

  candidates.forEach(c => {
    const dept = c.department || 'Khác';
    if (!map[dept]) {
      map[dept] = { total: 0, attended: 0, passed: 0, accepted: 0, failed: 0 };
    }
    map[dept].total++;
    if (c.status !== 'scheduled' && c.status !== 'cancelled') {
      map[dept].attended++;
    }
    if (c.status === 'passed' || c.status === 'accepted') {
      map[dept].passed++;
    }
    if (c.status === 'accepted') {
      map[dept].accepted++;
    }
    if (c.status === 'failed') {
      map[dept].failed++;
    }
  });

  return Object.entries(map).map(([name, data]) => ({
    name,
    total: data.total,
    attended: data.attended,
    passed: data.passed,
    accepted: data.accepted,
    failed: data.failed,
    passRate: data.attended > 0 ? Number(((data.passed / data.attended) * 100).toFixed(1)) : 0
  })).sort((a, b) => b.total - a.total);
}

export function getRecruitmentBreakdownByPosition(candidates: InterviewCandidate[]): RecruitmentBreakdownItem[] {
  const map: Record<string, { total: number; attended: number; passed: number; accepted: number; failed: number }> = {};

  candidates.forEach(c => {
    const pos = c.position || 'Chưa phân loại';
    if (!map[pos]) {
      map[pos] = { total: 0, attended: 0, passed: 0, accepted: 0, failed: 0 };
    }
    map[pos].total++;
    if (c.status !== 'scheduled' && c.status !== 'cancelled') {
      map[pos].attended++;
    }
    if (c.status === 'passed' || c.status === 'accepted') {
      map[pos].passed++;
    }
    if (c.status === 'accepted') {
      map[pos].accepted++;
    }
    if (c.status === 'failed') {
      map[pos].failed++;
    }
  });

  return Object.entries(map).map(([name, data]) => ({
    name,
    total: data.total,
    attended: data.attended,
    passed: data.passed,
    accepted: data.accepted,
    failed: data.failed,
    passRate: data.attended > 0 ? Number(((data.passed / data.attended) * 100).toFixed(1)) : 0
  })).sort((a, b) => b.total - a.total);
}

export function exportMonthlyRecruitmentReportToExcel(
  monthlyStats: MonthlyRecruitmentRecord[],
  year: number,
  allCandidates: InterviewCandidate[]
) {
  const wb = XLSX.utils.book_new();

  // 1. Sheet Tổng hợp 12 Tháng
  const summaryHeader = [
    [`BÁO CÁO THỐNG KÊ CÔNG TÁC PHỎNG VẤN & TUYỂN DỤNG NĂM ${year}`],
    [`Đơn vị: ${COMPANY_INFO.name}`],
    [`Địa chỉ: ${COMPANY_INFO.address}`],
    [],
    [
      'STT',
      'Tháng',
      'Tổng Hẹn PV',
      'Đã Tham Gia PV',
      'Tỷ Lệ Đến (%)',
      'Trúng Tuyển (Passed)',
      'Tỷ Lệ Đỗ (%)',
      'Đã Nhận Việc (Onboard)',
      'Tỷ Lệ Nhận Việc (%)',
      'Không Đạt',
      'Hủy / Vắng Mặt',
      'Đánh Giá Hiệu Suất'
    ]
  ];

  let totalScheduled = 0;
  let totalAttended = 0;
  let totalPassed = 0;
  let totalAccepted = 0;
  let totalFailed = 0;
  let totalCancelled = 0;

  const summaryRows = monthlyStats.map(s => {
    totalScheduled += s.totalScheduled;
    totalAttended += s.attendedCount;
    totalPassed += s.passedCount;
    totalAccepted += s.acceptedCount;
    totalFailed += s.failedCount;
    totalCancelled += s.cancelledCount;

    let evalRating = 'Chưa có số liệu';
    if (s.totalScheduled > 0) {
      if (s.onboardingRate >= 70 && s.passRate >= 60) evalRating = 'Rất tốt (Đạt chỉ tiêu)';
      else if (s.passRate >= 50) evalRating = 'Khá (Ổn định)';
      else evalRating = 'Cần tăng nguồn ứng viên';
    }

    return [
      s.month,
      s.monthLabel,
      s.totalScheduled,
      s.attendedCount,
      `${s.attendanceRate}%`,
      s.passedCount,
      `${s.passRate}%`,
      s.acceptedCount,
      `${s.onboardingRate}%`,
      s.failedCount,
      s.cancelledCount,
      evalRating
    ];
  });

  const avgAttendance = totalScheduled > 0 ? ((totalAttended / totalScheduled) * 100).toFixed(1) : '0';
  const avgPass = totalAttended > 0 ? ((totalPassed / totalAttended) * 100).toFixed(1) : '0';
  const avgOnboard = totalPassed > 0 ? ((totalAccepted / totalPassed) * 100).toFixed(1) : '0';

  const totalRow = [
    'TỔNG',
    `Cả năm ${year}`,
    totalScheduled,
    totalAttended,
    `${avgAttendance}%`,
    totalPassed,
    `${avgPass}%`,
    totalAccepted,
    `${avgOnboard}%`,
    totalFailed,
    totalCancelled,
    'Tổng kết toàn diện năm'
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet([...summaryHeader, ...summaryRows, totalRow]);
  XLSX.utils.book_append_sheet(wb, wsSummary, `Thong_Ke_Tuyen_Dung_${year}`);

  // 2. Sheet Danh Sách Ứng Viên Chi Tiết Trong Năm
  const yearCandidates = allCandidates
    .filter(c => c.interviewDate && c.interviewDate.startsWith(String(year)))
    .sort((a, b) => b.interviewDate.localeCompare(a.interviewDate));

  const candidateHeader = [
    [`DANH SÁCH CHI TIẾT ỨNG VIÊN PHỎNG VẤN NĂM ${year}`],
    [],
    [
      'STT',
      'Ngày PV',
      'Giờ PV',
      'Họ và Tên',
      'Số Điện Thoại',
      'Email',
      'Vị Trí Ứng Tuyển',
      'Bộ Phận',
      'Người Phỏng Vấn',
      'Địa Điểm',
      'Kết Quả',
      'Lương Kỳ Vọng',
      'Ghi Chú Đánh Giá'
    ]
  ];

  const candidateRows = yearCandidates.map((c, i) => [
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
      : c.status === 'interviewed' ? 'Đã PV - Chờ KQ'
      : c.status === 'passed' ? 'Trúng tuyển'
      : c.status === 'accepted' ? 'Đã nhận việc'
      : c.status === 'failed' ? 'Không đạt'
      : 'Hủy hẹn / Vắng',
    c.expectedSalary || '',
    c.notes || ''
  ]);

  const wsCandidates = XLSX.utils.aoa_to_sheet([...candidateHeader, ...candidateRows]);
  XLSX.utils.book_append_sheet(wb, wsCandidates, `Ung_Vien_${year}`);

  XLSX.writeFile(wb, `Bao_Cao_Thong_Ke_Tuyen_Dung_${year}_DH_Textile.xlsx`);
}
