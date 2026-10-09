export type Gender = 'Male' | 'Female' | 'Other';

export interface Employee {
  id: string; // Internal unique ID
  stt: number; // STT (No.)
  fullName: string; // HỌ VÀ TÊN (Full Name)
  gender: Gender; // GIỚI TÍNH (Gender)
  employeeId: string; // MÃ SỐ NHÂN VIÊN (Emp. ID)
  dateOfBirth: string; // NGÀY SINH (DOB) e.g., 1991-09-30 or 30/09/1991
  nationality: string; // QUỐC TỊCH (Nationality) e.g., Hàn Quốc, Việt Nam
  ethnicity: string; // Dân tộc (Ethnicity) e.g., Kinh, Tày, etc.
  nativePlace: string; // QUÊ QUÁN (Native place)
  permanentAddress: string; // HỘ KHẨU THƯỜNG TRÚ (Permanent Address)
  phoneNumber: string; // SỐ ĐIỆN THOẠI (Phone number)
  idCardNumber: string; // CMND/CCCD (ID Card) / Passport
  oldIdCardNumber?: string; // Số CMND cũ
  idIssueDate: string; // NGÀY CẤP (Issue date of ID card)
  idIssuePlace: string; // NƠI CẤP (Place of issue)
  educationDegree: string; // TRÌNH ĐỘ (Degree) e.g., University, College, THPT
  technicalProfession: string; // CHUYÊN MÔN KỸ THUẬT (Profession)
  rankLevel: string; // CẤP BẬC (Level) e.g., General Director, Manager, Specialist, Worker
  workingArea: string; // KHU VỰC LÀM VIỆC (Working Area) e.g., Xưởng may 1, Kho
  position: string; // VỊ TRÍ LÀM VIỆC (Position) e.g., Nhà quản lý/Tổng giám đốc
  department: string; // BỘ PHẬN (Department) e.g., BOD, HR, Production
  contractType: string; // LOẠI HĐLĐ (Contract type) e.g., 2 years, 1 year, Không xác định thời hạn
  contract1StartDate: string; // HỢP ĐỒNG LAO ĐỘNG LẦN 1 (Start date of 1st contract)
  contract1EndDate: string; // End date of 1st contract
  contract2EndDate: string; // End date of 2nd contract
  joiningDate: string; // NGÀY BẮT ĐẦU LÀM VIỆC (Joining date)
  timeOfService: number | string; // THỜI GIAN LÀM VIỆC (Time of Service in months, e.g. 83)
  resignationDate?: string; // NGÀY NGHỈ VIỆC (Resignation date)
  resignationReason?: string; // LÝ DO NGHỈ VIỆC (Resignation Reason)
  houseSubsidy?: string | number; // PHỤ CẤP NHÀ Ở (House Subsidy)
  remark?: string; // GHI CHÚ (Remark)
}

export type ContractExpiryStatus = 'active' | 'warning' | 'expired' | 'indefinite' | 'resigned';

export interface ColumnDefinition {
  key: keyof Employee | 'actions' | 'status';
  labelVi: string;
  labelEn: string;
  category: 'identity' | 'contact' | 'qualification' | 'position' | 'contract' | 'other';
  width?: string;
  align?: 'left' | 'center' | 'right';
  visible: boolean;
}
