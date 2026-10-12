import { useState } from 'react';
import { User, ShieldCheck, ArrowRight, KeyRound, AlertCircle } from 'lucide-react';
import { COMPANY_INFO } from '../data/initialEmployees';

interface LoginScreenProps {
  onLogin: (username: string, password: string) => Promise<void>;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onLogin(username.trim(), password);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Không thể đăng nhập.');
    } finally {
      setIsSubmitting(false);
    }
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
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập tên đăng nhập"
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
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu..."
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              <span>{isSubmitting ? 'Đang xác thực...' : 'Đăng Nhập'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-500">
          © 2026 <strong>Công ty TNHH DH Textile</strong>. Hệ thống quản trị lao động nội bộ.
        </p>
      </div>
    </div>
  );
};
