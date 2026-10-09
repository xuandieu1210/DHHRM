import { UserAccount } from '../types/auth';

export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'user-admin',
    username: 'admin',
    passwordHash: 'admin123',
    fullName: 'Deokyun Han',
    email: 'general.director@dhtextile.vn',
    role: 'admin',
    department: 'Ban Giám Đốc (BOD)',
    position: 'Tổng Giám Đốc & Quản Trị Hệ Thống',
    isActive: true,
    createdAt: '2024-01-01',
    lastLogin: '2026-10-09 08:15',
    avatarColor: 'bg-slate-900'
  },
  {
    id: 'user-hrmanager',
    username: 'hung.hr',
    passwordHash: 'hr123',
    fullName: 'Nguyễn Văn Hưng',
    email: 'hung.nguyen@dhtextile.vn',
    role: 'hr_manager',
    department: 'HR & Admin',
    position: 'Trưởng Phòng Nhân Sự - Hành Chính',
    isActive: true,
    createdAt: '2024-01-05',
    lastLogin: '2026-10-09 07:45',
    avatarColor: 'bg-indigo-600'
  },
  {
    id: 'user-recruiter',
    username: 'loan.recruiter',
    passwordHash: 'recruiter123',
    fullName: 'Huỳnh Thị Kim Loan',
    email: 'loan.huynh@dhtextile.vn',
    role: 'recruiter',
    department: 'HR & Admin',
    position: 'Chuyên Viên Tuyển Dụng & Đào Tạo',
    isActive: true,
    createdAt: '2024-03-10',
    lastLogin: '2026-10-08 16:30',
    avatarColor: 'bg-emerald-600'
  },
  {
    id: 'user-viewer',
    username: 'viewer',
    passwordHash: 'viewer123',
    fullName: 'Trần Thị Mỹ Linh',
    email: 'linh.tran@dhtextile.vn',
    role: 'viewer',
    department: 'Accounting',
    position: 'Kế Toán Trưởng (Xem Báo Cáo)',
    isActive: true,
    createdAt: '2024-04-01',
    lastLogin: '2026-10-07 11:20',
    avatarColor: 'bg-amber-600'
  }
];
