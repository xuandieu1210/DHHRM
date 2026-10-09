export type InterviewStatus = 
  | 'scheduled'   // Đã lên lịch hẹn
  | 'interviewed'   // Đã phỏng vấn xong - chờ kết quả
  | 'passed'        // Đạt phỏng vấn
  | 'accepted'      // Đã nhận việc / Sẵn sàng onboard
  | 'failed'        // Không đạt
  | 'cancelled';    // Hủy hẹn / Không đến

export interface InterviewCandidate {
  id: string;
  interviewDate: string; // YYYY-MM-DD
  interviewTime: string; // HH:mm e.g. 09:00
  fullName: string;
  phoneNumber: string;
  email?: string;
  position: string; // Vị trí ứng tuyển (VD: Công nhân may, Kỹ sư cơ điện...)
  department: string; // Bộ phận
  interviewer: string; // Người phỏng vấn / Trưởng bộ phận
  location: string; // Địa điểm PV (Phòng họp 1, Xưởng 2, Online...)
  status: InterviewStatus;
  experienceYears?: number | string;
  degree?: string;
  expectedSalary?: string;
  notes?: string; // Nhận xét đánh giá
  rating?: number; // 1-5 sao hoặc điểm
  onboardDate?: string; // Ngày dự kiến đi làm
  isConvertedToEmployee?: boolean;
}

export interface MonthlyStatsRecord {
  month: number; // 1-12
  monthLabel: string; // T1, T2...
  year: number;
  activeCount: number;
  newJoinersCount: number;
  resignedCount: number;
  turnoverRate: number; // %
  joiners: { id: string; fullName: string; employeeId: string; department: string; position: string; joiningDate: string }[];
  resignees: { id: string; fullName: string; employeeId: string; department: string; position: string; resignationDate: string; reason: string }[];
}

export interface MonthlyRecruitmentRecord {
  month: number;
  year: number;
  monthLabel: string;
  totalScheduled: number;      // Tổng lịch hẹn PV
  attendedCount: number;       // Đã tham gia PV
  attendanceRate: number;      // Tỷ lệ tham gia (%)
  passedCount: number;         // Trúng tuyển
  passRate: number;            // Tỷ lệ đỗ (%)
  acceptedCount: number;       // Đã nhận việc (Onboard)
  onboardingRate: number;      // Tỷ lệ nhận việc (%) = accepted / passed
  failedCount: number;         // Không đạt
  cancelledCount: number;      // Hủy hẹn / Vắng mặt
  candidates: InterviewCandidate[];
}

