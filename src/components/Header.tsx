import React from 'react';
import { Menu, Plus, User, Shield, ExternalLink, ChevronRight } from 'lucide-react';
import { UserAccount, ROLE_DEFINITIONS } from '../types/auth';

export type AppTab = 'table' | 'salary' | 'monthly' | 'recruitment' | 'analytics' | 'alerts' | 'users';

interface HeaderProps {
  activeTab: AppTab;
  onAddNew: () => void;
  currentUser: UserAccount;
  canCreateEmployee: boolean;
  onOpenMobileSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onAddNew,
  currentUser,
  canCreateEmployee,
  onOpenMobileSidebar
}) => {
  const roleMeta = ROLE_DEFINITIONS[currentUser.role];

  // Breadcrumb titles
  const tabTitles: Record<AppTab, { group: string; title: string }> = {
    table: { group: 'Hồ Sơ & Tiền Lương', title: 'Sổ Quản Lý Lao Động (30 Cột Chuẩn)' },
    salary: { group: 'Hồ Sơ & Tiền Lương', title: 'Quản Lý Lương & Các Khoản Phụ Cấp' },
    alerts: { group: 'Hồ Sơ & Tiền Lương', title: 'Cảnh Báo Hết Hạn Hợp Đồng' },
    recruitment: { group: 'Tuyển Dụng & Biến Động', title: 'Lịch Phỏng Vấn & Thống Kê Tuyển Dụng' },
    monthly: { group: 'Tuyển Dụng & Biến Động', title: 'Biến Động Nhân Sự & Thôi Việc Theo Tháng' },
    analytics: { group: 'Báo Cáo & Hệ Thống', title: 'Cơ Cấu Lao Động & Thống Kê' },
    users: { group: 'Báo Cáo & Hệ Thống', title: 'Quản Lý Tài Khoản & Phân Quyền (RBAC)' }
  };

  const currentInfo = tabTitles[activeTab] || { group: 'Hệ Thống', title: 'Quản Lý Nhân Sự' };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
      <div className="px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left Zone: Mobile Menu Toggle + Breadcrumbs */}
          <div className="flex items-center gap-3">
            {/* Mobile Sidebar Hamburger Toggle */}
            <button
              onClick={onOpenMobileSidebar}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Mở menu chức năng"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb Trail */}
            <nav className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="hidden sm:inline font-medium text-slate-400">
                {currentInfo.group}
              </span>
              <ChevronRight className="hidden sm:inline w-3 h-3 text-slate-300" />
              <span className="font-bold text-slate-900 text-xs sm:text-sm">
                {currentInfo.title}
              </span>
            </nav>
          </div>

          {/* Right Zone: User Info & Primary CTA */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Role Badge Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold bg-slate-50">
              <span className="text-slate-500 font-medium text-[11px]">Vai trò:</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${roleMeta.badgeClass}`}>
                {currentUser.role.toUpperCase()}
              </span>
            </div>

            {/* Primary Action Button */}
            {canCreateEmployee && (
              <button
                onClick={onAddNew}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors whitespace-nowrap cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Nhân Viên</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
