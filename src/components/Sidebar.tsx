import React from 'react';
import { 
  FileSpreadsheet, 
  DollarSign, 
  TrendingUp, 
  CalendarCheck, 
  BarChart3, 
  AlertCircle, 
  Shield, 
  LogOut, 
  User, 
  Building2,
  ChevronRight,
  X
} from 'lucide-react';
import { AppTab } from './Header';
import { UserAccount, ROLE_DEFINITIONS } from '../types/auth';
import { COMPANY_INFO } from '../data/initialEmployees';

interface SidebarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  currentUser: UserAccount;
  onLogout: () => void;
  warningCount: number;
  todayInterviewCount: number;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
  warningCount,
  todayInterviewCount,
  isMobileOpen,
  setIsMobileOpen
}) => {
  const roleMeta = ROLE_DEFINITIONS[currentUser.role];
  const canViewSalary = roleMeta.defaultPermissions.canViewSalary;

  const handleNavClick = (tab: AppTab) => {
    setActiveTab(tab);
    setIsMobileOpen(false);
  };

  const menuItems = [
    {
      group: 'HỒ SƠ & TIỀN LƯƠNG',
      items: [
        {
          id: 'table' as AppTab,
          label: 'Sổ Quản Lý Lao Động',
          icon: FileSpreadsheet,
          badge: null
        },
        ...(canViewSalary ? [
          {
            id: 'salary' as AppTab,
            label: 'Quản Lý Lương & Phụ Cấp',
            icon: DollarSign,
            badge: null
          }
        ] : []),
        {
          id: 'alerts' as AppTab,
          label: 'Cảnh Báo Hết Hạn HĐ',
          icon: AlertCircle,
          badge: warningCount > 0 ? { count: warningCount, color: 'bg-amber-100 text-amber-800' } : null
        }
      ]
    },
    {
      group: 'TUYỂN DỤNG & BIẾN ĐỘNG',
      items: [
        {
          id: 'recruitment' as AppTab,
          label: 'Lịch PV & Tuyển Dụng',
          icon: CalendarCheck,
          badge: todayInterviewCount > 0 ? { count: todayInterviewCount, color: 'bg-emerald-100 text-emerald-800' } : null
        },
        {
          id: 'monthly' as AppTab,
          label: 'Biến Động Nhân Sự Tháng',
          icon: TrendingUp,
          badge: null
        }
      ]
    },
    {
      group: 'BÁO CÁO & HỆ THỐNG',
      items: [
        {
          id: 'analytics' as AppTab,
          label: 'Cơ Cấu Nhân Sự',
          icon: BarChart3,
          badge: null
        },
        ...(currentUser.role === 'admin' ? [
          {
            id: 'users' as AppTab,
            label: 'Quản Lý User & Phân Quyền',
            icon: Shield,
            badge: null
          }
        ] : [])
      ]
    }
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 w-64 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white text-slate-900 font-bold flex items-center justify-center text-base shadow-sm">
            DH
          </div>
          <div>
            <h1 className="font-bold text-white text-sm tracking-tight leading-tight">
              DH Textile HRMS
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">
              KCN Tam Thăng, Q.Nam
            </p>
          </div>
        </div>

        {/* Close button for mobile drawer */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto p-3.5 space-y-6 text-xs">
        {menuItems.map((sec, idx) => (
          <div key={idx} className="space-y-1.5">
            <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase px-2.5 block">
              {sec.group}
            </span>

            <div className="space-y-1">
              {sec.items.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-all group ${
                      isActive
                        ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge ? (
                      <span className={`text-[10px] font-bold font-mono px-1.5 py-0.2 rounded-md shrink-0 ${item.badge.color}`}>
                        {item.badge.count}
                      </span>
                    ) : isActive ? (
                      <ChevronRight className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Account Card at Bottom */}
      <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/40">
        <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5 truncate">
            <div className={`w-8 h-8 rounded-lg ${currentUser.avatarColor || 'bg-slate-700'} text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs`}>
              {currentUser.fullName.charAt(0)}
            </div>
            <div className="truncate text-left">
              <div className="text-xs font-bold text-white truncate leading-tight">
                {currentUser.fullName}
              </div>
              <div className="text-[10px] text-slate-400 truncate mt-0.5">
                {roleMeta.nameVi.split('(')[0]}
              </div>
            </div>
          </div>

          <button
            onClick={onLogout}
            title="Đăng xuất"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700/50 rounded-lg transition-colors shrink-0 ml-1 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Left Sidebar */}
      <aside className="hidden lg:block shrink-0 sticky top-0 h-screen z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
