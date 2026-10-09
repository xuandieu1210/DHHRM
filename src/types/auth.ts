export type UserRole = 'admin' | 'hr_manager' | 'recruiter' | 'viewer';

export interface UserPermission {
  canManageUsers: boolean;       // Quản lý tài khoản & phân quyền
  canCreateEmployee: boolean;     // Thêm nhân viên vào Sổ LĐ
  canEditEmployee: boolean;       // Chỉnh sửa hồ sơ lao động
  canDeleteEmployee: boolean;     // Xóa nhân viên
  canManageRecruitment: boolean;  // Quản lý lịch hẹn & ứng viên PV
  canOnboardCandidate: boolean;   // Tiếp nhận ứng viên vào Sổ LĐ
  canRenewContract: boolean;      // Tái ký & gia hạn hợp đồng
  canExportImportExcel: boolean;  // Nhập & xuất dữ liệu Excel
  canViewSalary: boolean;         // Xem thông tin lương & các khoản phụ cấp
  canManageSalary: boolean;       // Thêm, sửa, xóa cấu hình lương
}

export interface UserAccount {
  id: string;
  username: string;
  passwordHash: string; // Plain/hashed for client session
  fullName: string;
  email: string;
  role: UserRole;
  department: string;
  position: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  avatarColor?: string;
}

export const ROLE_DEFINITIONS: Record<UserRole, {
  nameVi: string;
  description: string;
  badgeClass: string;
  defaultPermissions: UserPermission;
}> = {
  admin: {
    nameVi: 'Quản Trị Viên (Admin)',
    description: 'Toàn quyền quản trị hệ thống, quản lý tài khoản người dùng, hồ sơ lao động và bảng lương.',
    badgeClass: 'bg-red-100 text-red-800 border-red-200',
    defaultPermissions: {
      canManageUsers: true,
      canCreateEmployee: true,
      canEditEmployee: true,
      canDeleteEmployee: true,
      canManageRecruitment: true,
      canOnboardCandidate: true,
      canRenewContract: true,
      canExportImportExcel: true,
      canViewSalary: true,
      canManageSalary: true,
    }
  },
  hr_manager: {
    nameVi: 'Trưởng Phòng Nhân Sự (HR Manager)',
    description: 'Quản lý toàn diện hồ sơ lao động, bảng lương & phụ cấp, tái ký hợp đồng và duyệt tiếp nhận nhân sự.',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    defaultPermissions: {
      canManageUsers: false,
      canCreateEmployee: true,
      canEditEmployee: true,
      canDeleteEmployee: true,
      canManageRecruitment: true,
      canOnboardCandidate: true,
      canRenewContract: true,
      canExportImportExcel: true,
      canViewSalary: true,
      canManageSalary: true,
    }
  },
  recruiter: {
    nameVi: 'Chuyên Viên Tuyển Dụng (Recruiter)',
    description: 'Quản lý lịch hẹn phỏng vấn, báo cáo tuyển dụng tháng, xem hồ sơ lao động (Không có quyền xem lương & phụ cấp).',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    defaultPermissions: {
      canManageUsers: false,
      canCreateEmployee: false,
      canEditEmployee: false,
      canDeleteEmployee: false,
      canManageRecruitment: true,
      canOnboardCandidate: false,
      canRenewContract: false,
      canExportImportExcel: true,
      canViewSalary: false,
      canManageSalary: false,
    }
  },
  viewer: {
    nameVi: 'Nhân Viên / Xem Báo Cáo (Viewer)',
    description: 'Chỉ có quyền xem thông tin cơ bản Sổ lao động và biểu đồ (Không có quyền xem lương phụ cấp).',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    defaultPermissions: {
      canManageUsers: false,
      canCreateEmployee: false,
      canEditEmployee: false,
      canDeleteEmployee: false,
      canManageRecruitment: false,
      canOnboardCandidate: false,
      canRenewContract: false,
      canExportImportExcel: false,
      canViewSalary: false,
      canManageSalary: false,
    }
  }
};
