export interface EmployeeSalary {
  id: string;
  employeeId: string; // Mã NV (DH1001...)
  fullName: string;
  department: string;
  position: string;
  currency: 'USD' | 'VND';
  
  // Lương cơ bản
  basicSalary: number; // Basic Salary (VD: 3,500 hoặc 15,000,000)

  // Allowance & Subsidy (Các khoản phụ cấp, trợ cấp)
  positionAllowance: number;      // Phụ cấp chức vụ (Position Allowance)
  responsibleAllowance: number;   // Phụ cấp trách nhiệm (Responsible Allowance)
  petrolSubsidy: number;          // Trợ cấp xăng xe (Petrol Subsidy)
  phoneSubsidy: number;           // Trợ cấp điện thoại (Phone Subsidy)
  languageSubsidy: number;        // Trợ cấp ngôn ngữ (Language Subsidy)
  regulationSubsidy: number;      // Trợ cấp nội quy (Regulation compliance subsidy)
  uniformSubsidy: number;         // Hỗ trợ trang phục (Uniform subsidy)
  abilityAllowance: number;       // Trợ cấp đánh giá năng lực (Ability allowance)
  houseSubsidy: number;           // Trợ cấp nhà ở (House Subsidy)
  transportationSubsidy: number;  // Trợ cấp về nước thăm thân (Transportation fee Subsidy)
  livingExpenseSubsidy: number;   // Trợ cấp xa nhà (Living expense Subsidy)
  mealAllowance: number;          // Hỗ trợ tiền ăn (Meal allowance)

  // Calculated totals
  totalAllowance: number; // Tổng phụ cấp & trợ cấp
  totalSalary: number;    // Tổng lương = Basic + Total Allowance

  effectiveDate: string;  // Ngày áp dụng
  notes?: string;         // Ghi chú
}

export type AllowanceFieldKey = 
  | 'positionAllowance'
  | 'responsibleAllowance'
  | 'petrolSubsidy'
  | 'phoneSubsidy'
  | 'languageSubsidy'
  | 'regulationSubsidy'
  | 'uniformSubsidy'
  | 'abilityAllowance'
  | 'houseSubsidy'
  | 'transportationSubsidy'
  | 'livingExpenseSubsidy'
  | 'mealAllowance';
