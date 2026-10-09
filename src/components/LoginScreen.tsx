import React, { useState } from 'react';
import { Lock, User, ShieldCheck, ArrowRight, Building2, KeyRound, AlertCircle } from 'lucide-react';
import { UserAccount, ROLE_DEFINITIONS } from '../types/auth';
import { COMPANY_INFO } from '../data/initialEmployees';

interface LoginScreenProps {
  users: UserAccount[];
  onLogin: (user: UserAccount) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ users, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const found = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
    if (!found) {
      setError('Tên đăng nhập không tồn tại trong hệ thống.');
      return;
    }

    if (!found.isActive) {
      setError('Tài khoản này đang bị khóa. Vui lòng liên hệ Quản trị viên hệ thống.');
      return;
    }

    if (found.passwordHash !== password) {
      setError('Mật khẩu không chính xác. Vui lòng thử lại.');
      return;
    }

    // Success
    onLogin(found);
  };

  const handleQuickLogin = (user: UserAccount) => {
    setUsername(user.username);
    setPassword(user.passwordHash);
    onLogin(user);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Company Header Card */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white text-slate-900 font-bold text-2xl shadow-xl">
            DH
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            DH Textile HRMS
          </h1>
          <p className="text-xs text-slate-400">
            Hệ Thống Sổ Quản Lý Lao Động &amp; Quản Trị Nhân Sự Doanh Nghiệp
          </p>
          <div className="inline-block px-3 py-1 bg-slate-800 text-slate-300 rounded-full text-[11px] font-medium border border-slate-700">
            {COMPANY_INFO.address}
          </div>
        </div>

        {/* Login Form Box */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 space-y-5 border border-slate-200">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              Đăng Nhập Hệ Thống Phân Quyền
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Nhập tài khoản được cấp để truy cập dữ liệu nhân sự bảo mật.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Tên đăng nhập (Username)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin, hung.hr, loan.recruiter..."
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Mật khẩu (Password)
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu..."
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              <span>Đăng Nhập</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Accounts Selection */}
          <div className="pt-4 border-t border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
              Đăng nhập nhanh theo vai trò (Thử nghiệm demo):
            </span>

            <div className="space-y-2">
              {users.map((u) => {
                const roleMeta = ROLE_DEFINITIONS[u.role];
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickLogin(u)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-all flex items-center justify-between text-left group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-md ${u.avatarColor || 'bg-slate-700'} text-white font-bold flex items-center justify-center text-xs shrink-0`}>
                        {u.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-xs group-hover:text-indigo-600">
                          {u.fullName}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          user: <strong>{u.username}</strong>
                        </div>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${roleMeta.badgeClass}`}>
                      {u.role.toUpperCase()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-500">
          © 2026 <strong>Công ty TNHH DH Textile</strong>. Hệ thống quản trị lao động nội bộ.
        </p>
      </div>
    </div>
  );
};
