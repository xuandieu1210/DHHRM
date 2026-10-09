import React, { useState } from 'react';
import { Users, UserPlus, Shield, ShieldCheck, Lock, Unlock, Edit, Trash2, Key, CheckCircle, AlertCircle, X, Search } from 'lucide-react';
import { UserAccount, UserRole, ROLE_DEFINITIONS } from '../types/auth';

interface UserManagementProps {
  users: UserAccount[];
  currentUser: UserAccount;
  onSaveUser: (user: UserAccount) => void;
  onDeleteUser: (userId: string) => void;
  onToggleUserStatus: (userId: string) => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  users,
  currentUser,
  onSaveUser,
  onDeleteUser,
  onToggleUserStatus
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<UserAccount>>({
    fullName: '',
    username: '',
    passwordHash: '',
    email: '',
    role: 'hr_manager',
    department: 'HR & Admin',
    position: 'Chuyên Viên Nhân Sự',
    isActive: true
  });
  const [formError, setFormError] = useState<string | null>(null);

  const filteredUsers = users.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const mName = u.fullName.toLowerCase().includes(term);
      const mUser = u.username.toLowerCase().includes(term);
      const mEmail = u.email.toLowerCase().includes(term);
      const mDept = u.department.toLowerCase().includes(term);
      if (!mName && !mUser && !mEmail && !mDept) return false;
    }
    return true;
  });

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      fullName: '',
      username: '',
      passwordHash: 'dhtextile123',
      email: '',
      role: 'hr_manager',
      department: 'HR & Admin',
      position: 'Chuyên Viên Nhân Sự',
      isActive: true,
      avatarColor: 'bg-indigo-600'
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: UserAccount) => {
    setEditingUser(user);
    setFormData({ ...user });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.fullName || !formData.username) {
      setFormError('Vui lòng nhập đầy đủ Họ tên và Tên đăng nhập');
      return;
    }

    const trimmedUser = formData.username.trim().toLowerCase();
    // Check username uniqueness
    const duplicate = users.find(u => u.username.toLowerCase() === trimmedUser && u.id !== editingUser?.id);
    if (duplicate) {
      setFormError('Tên đăng nhập này đã được sử dụng bởi người dùng khác.');
      return;
    }

    const userToSave: UserAccount = {
      id: editingUser?.id || `user-${Date.now()}`,
      username: trimmedUser,
      passwordHash: formData.passwordHash || 'dhtextile123',
      fullName: formData.fullName || '',
      email: formData.email || `${trimmedUser}@dhtextile.vn`,
      role: (formData.role as UserRole) || 'hr_manager',
      department: formData.department || 'HR & Admin',
      position: formData.position || 'Nhân sự',
      isActive: formData.isActive !== undefined ? formData.isActive : true,
      createdAt: editingUser?.createdAt || '2026-10-09',
      lastLogin: editingUser?.lastLogin,
      avatarColor: editingUser?.avatarColor || (formData.role === 'admin' ? 'bg-slate-900' : 'bg-indigo-600')
    };

    onSaveUser(userToSave);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            Quản Lý Tài Khoản Người Dùng &amp; Phân Quyền (RBAC)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Thiết lập danh sách nhân viên vận hành hệ thống, cấp quyền truy cập theo vai trò công việc tại DH Textile.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors whitespace-nowrap cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Thêm Tài Khoản Mới</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo Tên, Username, Email, Bộ phận..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="font-medium text-slate-500 whitespace-nowrap">Lọc vai trò:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-none"
          >
            <option value="all">Tất cả vai trò</option>
            <option value="admin">Quản Trị Viên (Admin)</option>
            <option value="hr_manager">Trưởng Phòng Nhân Sự (HR Manager)</option>
            <option value="recruiter">Chuyên Viên Tuyển Dụng (Recruiter)</option>
            <option value="viewer">Xem Báo Cáo (Viewer)</option>
          </select>

          <span className="text-slate-500 font-mono ml-2 whitespace-nowrap">
            {filteredUsers.length} tài khoản
          </span>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[11px] border-b border-slate-200 select-none">
              <tr>
                <th className="py-3 px-4">Người Dùng</th>
                <th className="py-3 px-4">Tài Khoản (Username)</th>
                <th className="py-3 px-4">Bộ Phận &amp; Chức Danh</th>
                <th className="py-3 px-4 text-center">Vai Trò Phân Quyền</th>
                <th className="py-3 px-4 text-center">Trạng Thái</th>
                <th className="py-3 px-4 text-center">Đăng Nhập Gần Nhất</th>
                <th className="py-3 px-4 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredUsers.map((u) => {
                const roleMeta = ROLE_DEFINITIONS[u.role];
                const isCurrent = u.id === currentUser.id;

                return (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Người dùng */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl ${u.avatarColor || 'bg-slate-800'} text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0`}>
                          {u.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                            {u.fullName}
                            {isCurrent && (
                              <span className="text-[10px] bg-slate-900 text-white font-mono px-1.5 py-0.2 rounded">
                                Bạn
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">{u.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Username */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      @{u.username}
                    </td>

                    {/* Bộ phận & Vị trí */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{u.position}</div>
                      <div className="text-[11px] text-slate-500">{u.department}</div>
                    </td>

                    {/* Vai trò */}
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold border ${roleMeta.badgeClass}`}>
                        {roleMeta.nameVi}
                      </span>
                    </td>

                    {/* Trạng thái */}
                    <td className="py-3 px-4 text-center">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-semibold">
                          <CheckCircle className="w-3 h-3" /> Đang hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[11px] font-semibold">
                          <Lock className="w-3 h-3" /> Đã khóa
                        </span>
                      )}
                    </td>

                    {/* Đăng nhập */}
                    <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-500">
                      {u.lastLogin || 'Chưa đăng nhập'}
                    </td>

                    {/* Thao tác */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          title="Chỉnh sửa thông tin & đổi mật khẩu"
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {/* Lock / Unlock button (Cannot lock oneself) */}
                        {!isCurrent && (
                          <button
                            onClick={() => onToggleUserStatus(u.id)}
                            title={u.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                            className={`p-1.5 rounded-lg transition-colors ${
                              u.isActive ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            {u.isActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                          </button>
                        )}

                        {/* Delete button (Cannot delete oneself or primary admin) */}
                        {!isCurrent && u.username !== 'admin' && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Bạn có chắc chắn muốn xóa tài khoản "${u.fullName}" (@${u.username})?`)) {
                                onDeleteUser(u.id);
                              }
                            }}
                            title="Xóa tài khoản"
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permission Matrix (Ma trận phân quyền chi tiết) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            Ma Trận Phân Quyền Chi Tiết Theo Vai Trò (Role-Based Access Control)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Quy định giới hạn quyền hạn truy cập của từng vai trò trên các phân hệ của DH Textile HRMS.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border border-slate-200 rounded-lg">
            <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">Tính Năng / Thẩm Quyền</th>
                <th className="p-3 text-center text-red-700">Admin</th>
                <th className="p-3 text-center text-indigo-700">HR Manager</th>
                <th className="p-3 text-center text-emerald-700">Recruiter</th>
                <th className="p-3 text-center text-slate-700">Viewer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="p-3 font-semibold text-slate-800">Xem Sổ Quản Lý Lao Động (30 Cột)</td>
                <td className="p-3 text-center text-emerald-600 font-bold">✓ Có</td>
                <td className="p-3 text-center text-emerald-600 font-bold">✓ Có</td>
                <td className="p-3 text-center text-emerald-600 font-bold">✓ Có</td>
                <td className="p-3 text-center text-emerald-600 font-bold">✓ Có (Chỉ xem)</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-800">Thêm, Sửa hồ sơ lao động</td>
                <td className="p-3 text-center text-emerald-600 font-bold">✓ Toàn quyền</td>
                <td className="p-3 text-center text-emerald-600 font-bold">✓ Toàn quyền</td>
                <td className="p-3 text-center text-slate-300">✕ Không</td>
                <td className="p-3 text-center text-slate-300">✕ Không</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-800">Xóa lao động khỏi Sổ LĐ</td>
                <td className="p-3 text-center text-emerald-600 font-bold">✓ Có</td>
                <td className="p-3 text-center text-emerald-600 font-bold">✓ Có</td>
                <td className="p-3 text-center text-slate-300">✕ Không</td>
                <td className="p-3 text-center text-slate-300">✕ Không</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-800">Tái ký &amp; Gia hạn HĐLĐ hết hạn</td>
                <td className="p-3 text-center text-emerald-600 font-bold">✓ Có</td>
                <td className="p-3 text-center text-emerald-600 font-bold">✓ Có</td>
                <td className="p-3 text-center text-slate-300">✕ Không</td>
                <td className="p-3 text-center text-slate-300">✕ Không</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-800">Quản lý Lịch Phỏng Vấn Tuyển Dụng</td>
                <td className="p-3 text-center text-emerald-600 font-bold">✓ Có</td>
                <td className="p-3 text-center text-emerald-600 font-bold">✓ Có</td>
                <td className="p-3 text-center text-emerald-600 font-bold">✓ Chuyên trách</td>
                <td className="p-3 text-center text-slate-300">✕ Không</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-800">Tiếp nhận ứng viên vào Sổ LĐ (1-Click)</td>
                <td className="p-3 text-center text-emerald-600 font-bold">✓ Duyệt</td>
                <td className="p-3 text-center text-emerald-600 font-bold">✓ Duyệt</td>
                <td className="p-3 text-center text-slate-300">✕ Cần duyệt</td>
                <td className="p-3 text-center text-slate-300">✕ Không</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-800">Xem Báo Cáo Biến Động Nhân Sự Tháng</td>
                <td className="p-3 text-center text-emerald-600 font-bold">✓ Có</td>
                <td className="p-3 text-center text-emerald-600 font-bold">✓ Có</td>
                <td className="p-3 text-center text-slate-300">✕ Không</td>
                <td className="p-3 text-center text-emerald-600 font-bold">✓ Có</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-800">Xuất / Nhập Excel Sổ Lao Động</td>
                <td className="p-3 text-center text-emerald-600 font-bold">✓ Có</td>
                <td className="p-3 text-center text-emerald-600 font-bold">✓ Có</td>
                <td className="p-3 text-center text-emerald-600 font-bold">✓ Tuyển dụng</td>
                <td className="p-3 text-center text-slate-300">✕ Không</td>
              </tr>
              <tr className="bg-rose-50/40">
                <td className="p-3 font-bold text-rose-900">
                  Xem Bảng Lương &amp; Các Khoản Phụ Cấp (USD / VND)
                </td>
                <td className="p-3 text-center text-emerald-600 font-bold">✓ Toàn quyền</td>
                <td className="p-3 text-center text-emerald-600 font-bold">✓ Xem &amp; Duyệt</td>
                <td className="p-3 text-center text-rose-600 font-bold bg-rose-100/60">✕ Bị chặn (Không xem được)</td>
                <td className="p-3 text-center text-slate-400">✕ Không có quyền</td>
              </tr>
              <tr className="bg-rose-50/20">
                <td className="p-3 font-semibold text-slate-800">
                  Quản Lý, Thêm &amp; Sửa Biểu Lương Nhân Viên
                </td>
                <td className="p-3 text-center text-emerald-600 font-bold">✓ Toàn quyền</td>
                <td className="p-3 text-center text-emerald-600 font-bold">✓ Toàn quyền</td>
                <td className="p-3 text-center text-slate-300">✕ Không</td>
                <td className="p-3 text-center text-slate-300">✕ Không</td>
              </tr>
              <tr className="bg-amber-50/50">
                <td className="p-3 font-bold text-slate-900">Quản Trị Người Dùng &amp; Cấp Quyền</td>
                <td className="p-3 text-center text-emerald-600 font-bold">✓ Toàn quyền</td>
                <td className="p-3 text-center text-slate-300">✕ Không</td>
                <td className="p-3 text-center text-slate-300">✕ Không</td>
                <td className="p-3 text-center text-slate-300">✕ Không</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingUser ? 'Chỉnh Sửa Tài Khoản Người Dùng' : 'Thêm Người Dùng Mới'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Phân quyền vận hành hệ thống DH Textile HRMS
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="m-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveForm} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Họ và tên người dùng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="VD: Trần Văn Bình"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tên đăng nhập (Username) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="VD: binh.tran"
                    className="w-full px-3 py-2 border border-slate-300 font-mono rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Mật khẩu (Password) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.passwordHash}
                    onChange={(e) => setFormData(prev => ({ ...prev, passwordHash: e.target.value }))}
                    placeholder="Mật khẩu..."
                    className="w-full px-3 py-2 border border-slate-300 font-mono rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Email công ty
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="binh.tran@dhtextile.vn"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              {/* Vai trò */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Vai trò phân quyền (Role) <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as UserRole }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none font-semibold text-slate-800"
                >
                  <option value="admin">Quản Trị Viên (Admin) - Toàn quyền</option>
                  <option value="hr_manager">Trưởng Phòng Nhân Sự (HR Manager)</option>
                  <option value="recruiter">Chuyên Viên Tuyển Dụng (Recruiter)</option>
                  <option value="viewer">Xem Báo Cáo (Viewer) - Chỉ đọc</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  {ROLE_DEFINITIONS[formData.role as UserRole]?.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Bộ phận
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                    placeholder="HR & Admin, Accounting..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Chức danh
                  </label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                    placeholder="Chuyên viên..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="w-4 h-4 text-slate-900 rounded focus:ring-slate-900"
                  />
                  <span className="font-semibold text-slate-700">Kích hoạt tài khoản ngay</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm"
                >
                  {editingUser ? 'Cập Nhật' : 'Tạo Tài Khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
