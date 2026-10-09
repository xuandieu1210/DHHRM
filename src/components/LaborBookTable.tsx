import React, { useState, useMemo } from 'react';
import { Search, Filter, Eye, Edit2, Trash2, ArrowUpDown, ChevronDown, CheckSquare, Square } from 'lucide-react';
import { Employee } from '../types/employee';
import { formatDateDisplay, getContractExpiryStatus } from '../utils/dateUtils';

interface LaborBookTableProps {
  employees: Employee[];
  themeStyle: 'excel' | 'modern';
  onViewEmployee: (emp: Employee) => void;
  onEditEmployee: (emp: Employee) => void;
  onDeleteEmployee: (emp: Employee) => void;
  canEditEmployee?: boolean;
  canDeleteEmployee?: boolean;
  canViewSalary?: boolean;
}

type ColumnCategory = 'all' | 'essential' | 'contract' | 'admin';

export const LaborBookTable: React.FC<LaborBookTableProps> = ({
  employees,
  themeStyle,
  onViewEmployee,
  onEditEmployee,
  onDeleteEmployee,
  canEditEmployee = true,
  canDeleteEmployee = true,
  canViewSalary = true
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedNationality, setSelectedNationality] = useState<string>('all');
  const [columnPreset, setColumnPreset] = useState<ColumnCategory>('all');
  const [sortField, setSortField] = useState<keyof Employee>('stt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Extract unique departments & nationalities
  const departments = useMemo(() => {
    const set = new Set(employees.map(e => e.department).filter(Boolean));
    return Array.from(set);
  }, [employees]);

  const nationalities = useMemo(() => {
    const set = new Set(employees.map(e => e.nationality).filter(Boolean));
    return Array.from(set);
  }, [employees]);

  // Filtering & Sorting
  const filteredEmployees = useMemo(() => {
    return employees
      .filter(emp => {
        // Search
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          const matchName = emp.fullName.toLowerCase().includes(term);
          const matchId = emp.employeeId.toLowerCase().includes(term);
          const matchIdCard = emp.idCardNumber.toLowerCase().includes(term);
          const matchPhone = emp.phoneNumber.toLowerCase().includes(term);
          const matchPos = emp.position.toLowerCase().includes(term);
          if (!matchName && !matchId && !matchIdCard && !matchPhone && !matchPos) {
            return false;
          }
        }

        // Department
        if (selectedDept !== 'all' && emp.department !== selectedDept) {
          return false;
        }

        // Nationality
        if (selectedNationality !== 'all' && emp.nationality !== selectedNationality) {
          return false;
        }

        // Status
        if (selectedStatus !== 'all') {
          const expStatus = getContractExpiryStatus(emp);
          if (selectedStatus === 'active') {
            if (emp.resignationDate) return false;
          } else if (selectedStatus === 'resigned') {
            if (!emp.resignationDate) return false;
          } else if (selectedStatus === 'expired') {
            if (expStatus.status !== 'expired') return false;
          } else if (selectedStatus === 'warning') {
            if (expStatus.status !== 'warning') return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortOrder === 'asc' ? valA - valB : valB - valA;
        }

        valA = String(valA || '').toLowerCase();
        valB = String(valB || '').toLowerCase();

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [employees, searchTerm, selectedDept, selectedNationality, selectedStatus, sortField, sortOrder]);

  const handleSort = (field: keyof Employee) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Theme header color
  const headerBgClass = themeStyle === 'excel' ? 'bg-[#ffff00] text-slate-900 border-b border-black' : 'bg-slate-100 text-slate-800 border-b border-slate-300';
  const tableBorderClass = themeStyle === 'excel' ? 'border-collapse border border-slate-400' : 'border-collapse border border-slate-200';
  const cellBorderClass = themeStyle === 'excel' ? 'border border-slate-300' : 'border-b border-r border-slate-200';

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo Tên, Mã NV (DH...), CCCD, SĐT, Vị trí..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            {/* Bộ phận */}
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="all">Tất cả Bộ phận</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            {/* Quốc tịch */}
            <select
              value={selectedNationality}
              onChange={(e) => setSelectedNationality(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="all">Tất cả Quốc tịch</option>
              {nationalities.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>

            {/* Trạng thái hợp đồng / việc làm */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang làm việc</option>
              <option value="warning">Sắp hết hạn HĐ (≤60 ngày)</option>
              <option value="expired">Đã quá hạn HĐ</option>
              <option value="resigned">Đã nghỉ việc</option>
            </select>
          </div>
        </div>

        {/* Column group presets */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-500 font-medium mr-1">Chế độ xem cột:</span>
            <button
              onClick={() => setColumnPreset('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                columnPreset === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              Toàn bộ 30 cột (Chuẩn Sổ LĐ)
            </button>
            <button
              onClick={() => setColumnPreset('essential')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                columnPreset === 'essential'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              Cơ bản &amp; Vị trí (Rút gọn)
            </button>
            <button
              onClick={() => setColumnPreset('contract')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                columnPreset === 'contract'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              Hợp đồng &amp; Thời hạn LĐ
            </button>
            <button
              onClick={() => setColumnPreset('admin')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                columnPreset === 'admin'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              Hồ sơ Pháp lý &amp; CCCD
            </button>
          </div>

          <div className="text-slate-500 font-medium">
            Hiển thị <span className="text-slate-900 font-semibold font-mono">{filteredEmployees.length}</span> / {employees.length} lao động
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[70vh]">
          <table className={`w-full text-xs text-left ${tableBorderClass}`}>
            <thead className={`sticky top-0 z-20 ${headerBgClass} text-[11px] uppercase tracking-tight font-bold select-none`}>
              <tr>
                {/* 1. STT */}
                <th
                  onClick={() => handleSort('stt')}
                  className={`p-2 text-center cursor-pointer hover:bg-black/5 whitespace-nowrap min-w-[50px] sticky left-0 z-30 ${themeStyle === 'excel' ? 'bg-[#ffff00]' : 'bg-slate-100'} ${cellBorderClass}`}
                >
                  <div className="flex flex-col items-center leading-tight">
                    <span>STT</span>
                    <span className="font-normal italic normal-case text-[10px]">No.</span>
                  </div>
                </th>

                {/* 2. Họ và tên */}
                <th
                  onClick={() => handleSort('fullName')}
                  className={`p-2 cursor-pointer hover:bg-black/5 whitespace-nowrap min-w-[170px] sticky left-[50px] z-30 ${themeStyle === 'excel' ? 'bg-[#ffff00]' : 'bg-slate-100'} ${cellBorderClass}`}
                >
                  <div className="flex flex-col leading-tight">
                    <div className="flex items-center justify-between">
                      <span>HỌ VÀ TÊN</span>
                      <ArrowUpDown className="w-3 h-3 opacity-60 ml-1 inline" />
                    </div>
                    <span className="font-normal italic normal-case text-[10px]">Full Name</span>
                  </div>
                </th>

                {/* 3. Giới tính */}
                <th className={`p-2 text-center whitespace-nowrap min-w-[70px] ${cellBorderClass}`}>
                  <div className="flex flex-col items-center leading-tight">
                    <span>GIỚI TÍNH</span>
                    <span className="font-normal italic normal-case text-[10px]">Gender</span>
                  </div>
                </th>

                {/* 4. Mã số nhân viên */}
                <th
                  onClick={() => handleSort('employeeId')}
                  className={`p-2 text-center cursor-pointer hover:bg-black/5 whitespace-nowrap min-w-[100px] ${cellBorderClass}`}
                >
                  <div className="flex flex-col items-center leading-tight">
                    <span>MÃ SỐ NV</span>
                    <span className="font-normal italic normal-case text-[10px]">Emp. ID</span>
                  </div>
                </th>

                {/* 5. Ngày sinh */}
                <th className={`p-2 text-center whitespace-nowrap min-w-[95px] ${cellBorderClass}`}>
                  <div className="flex flex-col items-center leading-tight">
                    <span>NGÀY SINH</span>
                    <span className="font-normal italic normal-case text-[10px]">DOB</span>
                  </div>
                </th>

                {/* 6. Quốc tịch */}
                <th className={`p-2 whitespace-nowrap min-w-[90px] ${cellBorderClass}`}>
                  <div className="flex flex-col leading-tight">
                    <span>QUỐC TỊCH</span>
                    <span className="font-normal italic normal-case text-[10px]">Nationality</span>
                  </div>
                </th>

                {/* Columns depending on preset */}
                {(columnPreset === 'all' || columnPreset === 'admin') && (
                  <>
                    {/* 7. Dân tộc */}
                    <th className={`p-2 whitespace-nowrap min-w-[70px] ${cellBorderClass}`}>
                      <div className="flex flex-col leading-tight">
                        <span>Dân tộc</span>
                      </div>
                    </th>

                    {/* 8. Quê quán */}
                    <th className={`p-2 whitespace-nowrap min-w-[130px] ${cellBorderClass}`}>
                      <div className="flex flex-col leading-tight">
                        <span>QUÊ QUÁN</span>
                        <span className="font-normal italic normal-case text-[10px]">Native place</span>
                      </div>
                    </th>

                    {/* 9. Hộ khẩu thường trú */}
                    <th className={`p-2 whitespace-nowrap min-w-[180px] ${cellBorderClass}`}>
                      <div className="flex flex-col leading-tight">
                        <span>HỘ KHẨU THƯỜNG TRÚ</span>
                        <span className="font-normal italic normal-case text-[10px]">Permanent Address</span>
                      </div>
                    </th>

                    {/* 10. Số điện thoại */}
                    <th className={`p-2 whitespace-nowrap min-w-[110px] ${cellBorderClass}`}>
                      <div className="flex flex-col leading-tight">
                        <span>SỐ ĐIỆN THOẠI</span>
                        <span className="font-normal italic normal-case text-[10px]">Phone number</span>
                      </div>
                    </th>

                    {/* 11. CMND/CCCD */}
                    <th className={`p-2 text-center whitespace-nowrap min-w-[115px] ${cellBorderClass}`}>
                      <div className="flex flex-col items-center leading-tight">
                        <span>CMND/CCCD</span>
                        <span className="font-normal italic normal-case text-[10px]">ID Card</span>
                      </div>
                    </th>

                    {/* 12. Số CMND cũ */}
                    <th className={`p-2 text-center whitespace-nowrap min-w-[90px] ${cellBorderClass}`}>
                      <div className="flex flex-col items-center leading-tight">
                        <span>Số CMND cũ</span>
                      </div>
                    </th>

                    {/* 13. Ngày cấp */}
                    <th className={`p-2 text-center whitespace-nowrap min-w-[95px] ${cellBorderClass}`}>
                      <div className="flex flex-col items-center leading-tight">
                        <span>NGÀY CẤP</span>
                        <span className="font-normal italic normal-case text-[10px]">Issue date</span>
                      </div>
                    </th>

                    {/* 14. Nơi cấp */}
                    <th className={`p-2 whitespace-nowrap min-w-[140px] ${cellBorderClass}`}>
                      <div className="flex flex-col leading-tight">
                        <span>NƠI CẤP</span>
                        <span className="font-normal italic normal-case text-[10px]">Place of issue</span>
                      </div>
                    </th>
                  </>
                )}

                {/* 15. Trình độ */}
                {(columnPreset === 'all' || columnPreset === 'essential') && (
                  <th className={`p-2 whitespace-nowrap min-w-[95px] ${cellBorderClass}`}>
                    <div className="flex flex-col leading-tight">
                      <span>TRÌNH ĐỘ</span>
                      <span className="font-normal italic normal-case text-[10px]">Degree</span>
                    </div>
                  </th>
                )}

                {/* 16. Chuyên môn kỹ thuật */}
                {(columnPreset === 'all' || columnPreset === 'essential') && (
                  <th className={`p-2 whitespace-nowrap min-w-[150px] ${cellBorderClass}`}>
                    <div className="flex flex-col leading-tight">
                      <span>CHUYÊN MÔN KỸ THUẬT</span>
                      <span className="font-normal italic normal-case text-[10px]">Profession</span>
                    </div>
                  </th>
                )}

                {/* 17. Cấp bậc */}
                <th className={`p-2 whitespace-nowrap min-w-[110px] ${cellBorderClass}`}>
                  <div className="flex flex-col leading-tight">
                    <span>CẤP BẬC</span>
                    <span className="font-normal italic normal-case text-[10px]">Level</span>
                  </div>
                </th>

                {/* 18. Khu vực làm việc */}
                {(columnPreset === 'all' || columnPreset === 'essential') && (
                  <th className={`p-2 whitespace-nowrap min-w-[130px] ${cellBorderClass}`}>
                    <div className="flex flex-col leading-tight">
                      <span>KHU VỰC LÀM VIỆC</span>
                      <span className="font-normal italic normal-case text-[10px]">Working Area</span>
                    </div>
                  </th>
                )}

                {/* 19. Vị trí làm việc */}
                <th className={`p-2 whitespace-nowrap min-w-[160px] ${cellBorderClass}`}>
                  <div className="flex flex-col leading-tight">
                    <span>VỊ TRÍ LÀM VIỆC</span>
                    <span className="font-normal italic normal-case text-[10px]">Position</span>
                  </div>
                </th>

                {/* 20. Bộ phận */}
                <th
                  onClick={() => handleSort('department')}
                  className={`p-2 cursor-pointer hover:bg-black/5 whitespace-nowrap min-w-[100px] ${cellBorderClass}`}
                >
                  <div className="flex flex-col leading-tight">
                    <span>BỘ PHẬN</span>
                    <span className="font-normal italic normal-case text-[10px]">Department</span>
                  </div>
                </th>

                {/* 21. Loại HĐLĐ */}
                <th className={`p-2 whitespace-nowrap min-w-[110px] ${cellBorderClass}`}>
                  <div className="flex flex-col leading-tight">
                    <span>LOẠI HĐLĐ</span>
                    <span className="font-normal italic normal-case text-[10px]">Contract type</span>
                  </div>
                </th>

                {/* 22. HĐLĐ lần 1 (Start date) */}
                {(columnPreset === 'all' || columnPreset === 'contract') && (
                  <th className={`p-2 text-center whitespace-nowrap min-w-[115px] ${cellBorderClass}`}>
                    <div className="flex flex-col items-center leading-tight">
                      <span>HĐLĐ LẦN 1</span>
                      <span className="font-normal italic normal-case text-[10px]">Start 1st contract</span>
                    </div>
                  </th>
                )}

                {/* 23. End date of 1st contract */}
                {(columnPreset === 'all' || columnPreset === 'contract') && (
                  <th className={`p-2 text-center whitespace-nowrap min-w-[115px] ${cellBorderClass}`}>
                    <div className="flex flex-col items-center leading-tight">
                      <span>HẾT HẠN HĐ 1</span>
                      <span className="font-normal italic normal-case text-[10px]">End date 1st</span>
                    </div>
                  </th>
                )}

                {/* 24. End date of 2nd contract (with date 10/9/2026 header note from screenshot) */}
                {(columnPreset === 'all' || columnPreset === 'contract') && (
                  <th className={`p-2 text-center whitespace-nowrap min-w-[125px] ${cellBorderClass}`}>
                    <div className="flex flex-col items-center leading-tight">
                      <span>HẾT HẠN HĐ 2</span>
                      <span className="font-normal italic normal-case text-[10px]">End date 2nd</span>
                      <span className="text-[9px] font-mono text-slate-800 bg-amber-200/80 px-1 py-0.2 rounded mt-0.5">
                        Ref: 10/9/2026
                      </span>
                    </div>
                  </th>
                )}

                {/* 25. Ngày bắt đầu làm việc */}
                <th
                  onClick={() => handleSort('joiningDate')}
                  className={`p-2 text-center cursor-pointer hover:bg-black/5 whitespace-nowrap min-w-[105px] ${cellBorderClass}`}
                >
                  <div className="flex flex-col items-center leading-tight">
                    <span>NGÀY BẮT ĐẦU</span>
                    <span className="font-normal italic normal-case text-[10px]">Joining date</span>
                  </div>
                </th>

                {/* 26. Thời gian làm việc */}
                <th
                  onClick={() => handleSort('timeOfService')}
                  className={`p-2 text-center cursor-pointer hover:bg-black/5 whitespace-nowrap min-w-[100px] ${cellBorderClass}`}
                >
                  <div className="flex flex-col items-center leading-tight">
                    <span>THỜI GIAN LV</span>
                    <span className="font-normal italic normal-case text-[10px]">Time of Service</span>
                  </div>
                </th>

                {/* 27. Ngày nghỉ việc */}
                {(columnPreset === 'all' || columnPreset === 'contract') && (
                  <th className={`p-2 text-center whitespace-nowrap min-w-[105px] ${cellBorderClass}`}>
                    <div className="flex flex-col items-center leading-tight">
                      <span>NGÀY NGHỈ VIỆC</span>
                      <span className="font-normal italic normal-case text-[10px]">Resignation date</span>
                    </div>
                  </th>
                )}

                {/* 28. Lý do nghỉ việc */}
                {(columnPreset === 'all' || columnPreset === 'contract') && (
                  <th className={`p-2 whitespace-nowrap min-w-[140px] ${cellBorderClass}`}>
                    <div className="flex flex-col leading-tight">
                      <span>LÝ DO NGHỈ VIỆC</span>
                      <span className="font-normal italic normal-case text-[10px]">Resignation Reason</span>
                    </div>
                  </th>
                )}

                {/* 29. Phụ cấp nhà ở */}
                {(columnPreset === 'all') && (
                  <th className={`p-2 text-right whitespace-nowrap min-w-[110px] ${cellBorderClass}`}>
                    <div className="flex flex-col items-end leading-tight">
                      <span>PHỤ CẤP NHÀ Ở</span>
                      <span className="font-normal italic normal-case text-[10px]">House Subsidy</span>
                    </div>
                  </th>
                )}

                {/* 30. Ghi chú */}
                {(columnPreset === 'all') && (
                  <th className={`p-2 whitespace-nowrap min-w-[160px] ${cellBorderClass}`}>
                    <div className="flex flex-col leading-tight">
                      <span>GHI CHÚ</span>
                      <span className="font-normal italic normal-case text-[10px]">Remark</span>
                    </div>
                  </th>
                )}

                {/* Actions column */}
                <th className={`p-2 text-center whitespace-nowrap min-w-[90px] sticky right-0 z-30 ${themeStyle === 'excel' ? 'bg-[#ffff00]' : 'bg-slate-100'} ${cellBorderClass}`}>
                  <span className="leading-tight">THAO TÁC</span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={32} className="py-12 text-center text-slate-500">
                    <p className="font-medium text-sm">Không tìm thấy nhân viên nào khớp với bộ lọc.</p>
                    <p className="text-xs text-slate-400 mt-1">Vui lòng thử tìm với từ khóa hoặc điều kiện lọc khác.</p>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp, index) => {
                  const expStatus = getContractExpiryStatus(emp);
                  const isResigned = Boolean(emp.resignationDate);

                  return (
                    <tr
                      key={emp.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isResigned ? 'bg-slate-50/50 opacity-75' : ''
                      }`}
                    >
                      {/* 1. STT */}
                      <td className={`p-2 text-center font-mono tabular-nums sticky left-0 z-10 bg-white font-medium ${cellBorderClass}`}>
                        {index + 1}
                      </td>

                      {/* 2. Họ và tên */}
                      <td className={`p-2 sticky left-[50px] z-10 bg-white font-semibold text-slate-900 whitespace-nowrap ${cellBorderClass}`}>
                        <button
                          onClick={() => onViewEmployee(emp)}
                          className="hover:text-blue-600 hover:underline text-left"
                        >
                          {emp.fullName}
                        </button>
                      </td>

                      {/* 3. Giới tính */}
                      <td className={`p-2 text-center whitespace-nowrap ${cellBorderClass}`}>
                        {emp.gender === 'Male' ? 'Nam' : emp.gender === 'Female' ? 'Nữ' : emp.gender}
                      </td>

                      {/* 4. Mã số nhân viên */}
                      <td className={`p-2 text-center font-mono font-bold text-slate-900 whitespace-nowrap ${cellBorderClass}`}>
                        {emp.employeeId}
                      </td>

                      {/* 5. Ngày sinh */}
                      <td className={`p-2 text-center font-mono tabular-nums whitespace-nowrap ${cellBorderClass}`}>
                        {formatDateDisplay(emp.dateOfBirth)}
                      </td>

                      {/* 6. Quốc tịch */}
                      <td className={`p-2 whitespace-nowrap ${cellBorderClass}`}>
                        {emp.nationality}
                      </td>

                      {/* Optional Columns */}
                      {(columnPreset === 'all' || columnPreset === 'admin') && (
                        <>
                          {/* 7. Dân tộc */}
                          <td className={`p-2 whitespace-nowrap ${cellBorderClass}`}>
                            {emp.ethnicity || '-'}
                          </td>

                          {/* 8. Quê quán */}
                          <td className={`p-2 whitespace-nowrap text-slate-700 ${cellBorderClass}`}>
                            {emp.nativePlace || '-'}
                          </td>

                          {/* 9. Hộ khẩu thường trú */}
                          <td className={`p-2 whitespace-nowrap text-slate-700 max-w-[240px] truncate ${cellBorderClass}`} title={emp.permanentAddress}>
                            {emp.permanentAddress || '-'}
                          </td>

                          {/* 10. Số điện thoại */}
                          <td className={`p-2 font-mono tabular-nums whitespace-nowrap ${cellBorderClass}`}>
                            {emp.phoneNumber || '-'}
                          </td>

                          {/* 11. CMND/CCCD */}
                          <td className={`p-2 text-center font-mono font-medium text-slate-800 whitespace-nowrap ${cellBorderClass}`}>
                            {emp.idCardNumber || '-'}
                          </td>

                          {/* 12. Số CMND cũ */}
                          <td className={`p-2 text-center font-mono text-slate-500 whitespace-nowrap ${cellBorderClass}`}>
                            {emp.oldIdCardNumber || '-'}
                          </td>

                          {/* 13. Ngày cấp */}
                          <td className={`p-2 text-center font-mono tabular-nums whitespace-nowrap ${cellBorderClass}`}>
                            {formatDateDisplay(emp.idIssueDate)}
                          </td>

                          {/* 14. Nơi cấp */}
                          <td className={`p-2 whitespace-nowrap text-slate-700 ${cellBorderClass}`}>
                            {emp.idIssuePlace || '-'}
                          </td>
                        </>
                      )}

                      {/* 15. Trình độ */}
                      {(columnPreset === 'all' || columnPreset === 'essential') && (
                        <td className={`p-2 whitespace-nowrap font-medium text-slate-800 ${cellBorderClass}`}>
                          {emp.educationDegree || '-'}
                        </td>
                      )}

                      {/* 16. Chuyên môn kỹ thuật */}
                      {(columnPreset === 'all' || columnPreset === 'essential') && (
                        <td className={`p-2 whitespace-nowrap text-slate-700 ${cellBorderClass}`}>
                          {emp.technicalProfession || '-'}
                        </td>
                      )}

                      {/* 17. Cấp bậc */}
                      <td className={`p-2 whitespace-nowrap font-medium text-slate-800 ${cellBorderClass}`}>
                        {emp.rankLevel || '-'}
                      </td>

                      {/* 18. Khu vực làm việc */}
                      {(columnPreset === 'all' || columnPreset === 'essential') && (
                        <td className={`p-2 whitespace-nowrap text-slate-700 ${cellBorderClass}`}>
                          {emp.workingArea || '-'}
                        </td>
                      )}

                      {/* 19. Vị trí làm việc */}
                      <td className={`p-2 whitespace-nowrap font-medium text-slate-900 ${cellBorderClass}`}>
                        {emp.position || '-'}
                      </td>

                      {/* 20. Bộ phận */}
                      <td className={`p-2 whitespace-nowrap ${cellBorderClass}`}>
                        <span className="font-semibold text-slate-800">{emp.department}</span>
                      </td>

                      {/* 21. Loại HĐLĐ */}
                      <td className={`p-2 whitespace-nowrap ${cellBorderClass}`}>
                        {emp.contractType || '-'}
                      </td>

                      {/* 22. HĐLĐ lần 1 (Start date) - Green cell matching image! */}
                      {(columnPreset === 'all' || columnPreset === 'contract') && (
                        <td className={`p-2 text-center font-mono tabular-nums whitespace-nowrap ${
                          emp.contract1StartDate ? 'bg-[#98d89e] text-slate-950 font-bold' : ''
                        } ${cellBorderClass}`}>
                          {formatDateDisplay(emp.contract1StartDate)}
                        </td>
                      )}

                      {/* 23. End date 1st contract - Blue cell matching image! */}
                      {(columnPreset === 'all' || columnPreset === 'contract') && (
                        <td className={`p-2 text-center font-mono tabular-nums whitespace-nowrap ${
                          emp.contract1EndDate ? 'bg-[#56bbf1] text-slate-950 font-bold' : ''
                        } ${cellBorderClass}`}>
                          {formatDateDisplay(emp.contract1EndDate)}
                        </td>
                      )}

                      {/* 24. End date 2nd contract - Red cell matching image! */}
                      {(columnPreset === 'all' || columnPreset === 'contract') && (
                        <td className={`p-2 text-center font-mono tabular-nums whitespace-nowrap ${
                          emp.contract2EndDate
                            ? expStatus.status === 'expired'
                              ? 'bg-[#ea2027] text-white font-bold'
                              : expStatus.status === 'warning'
                              ? 'bg-[#f79f1f] text-white font-bold'
                              : 'bg-emerald-100 text-emerald-950 font-semibold'
                            : ''
                        } ${cellBorderClass}`}>
                          {formatDateDisplay(emp.contract2EndDate)}
                        </td>
                      )}

                      {/* 25. Ngày bắt đầu làm việc */}
                      <td className={`p-2 text-center font-mono tabular-nums font-semibold whitespace-nowrap ${cellBorderClass}`}>
                        {formatDateDisplay(emp.joiningDate)}
                      </td>

                      {/* 26. Thời gian làm việc (Time of Service) */}
                      <td className={`p-2 text-center font-mono font-bold text-slate-900 tabular-nums whitespace-nowrap ${cellBorderClass}`}>
                        {emp.timeOfService}
                        <span className="text-[10px] font-normal text-slate-500 ml-1">tháng</span>
                      </td>

                      {/* 27. Ngày nghỉ việc */}
                      {(columnPreset === 'all' || columnPreset === 'contract') && (
                        <td className={`p-2 text-center font-mono tabular-nums text-slate-600 whitespace-nowrap ${cellBorderClass}`}>
                          {formatDateDisplay(emp.resignationDate)}
                        </td>
                      )}

                      {/* 28. Lý do nghỉ việc */}
                      {(columnPreset === 'all' || columnPreset === 'contract') && (
                        <td className={`p-2 whitespace-nowrap text-slate-600 ${cellBorderClass}`}>
                          {emp.resignationReason || '-'}
                        </td>
                      )}

                      {/* 29. Phụ cấp nhà ở */}
                      {(columnPreset === 'all') && (
                        <td className={`p-2 text-right font-mono tabular-nums text-slate-800 whitespace-nowrap ${cellBorderClass}`}>
                          {canViewSalary ? (
                            emp.houseSubsidy ? `${emp.houseSubsidy}` : '-'
                          ) : (
                            <span className="text-slate-400 italic text-[11px]" title="Không có quyền xem lương phụ cấp">
                              *** (Bảo mật)
                            </span>
                          )}
                        </td>
                      )}

                      {/* 30. Ghi chú */}
                      {(columnPreset === 'all') && (
                        <td className={`p-2 whitespace-nowrap text-slate-600 max-w-[200px] truncate ${cellBorderClass}`} title={emp.remark}>
                          {emp.remark || '-'}
                        </td>
                      )}

                      {/* Actions */}
                      <td className={`p-2 text-center whitespace-nowrap sticky right-0 z-10 bg-white ${cellBorderClass}`}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onViewEmployee(emp)}
                            title="Xem chi tiết hồ sơ"
                            className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {canEditEmployee && (
                            <button
                              onClick={() => onEditEmployee(emp)}
                              title="Chỉnh sửa thông tin"
                              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canDeleteEmployee && (
                            <button
                              onClick={() => onDeleteEmployee(emp)}
                              title="Xóa nhân viên"
                              className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Legend bar matching the Excel highlights */}
        <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 flex items-center justify-between flex-wrap gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-semibold text-slate-700">Chú thích màu bảng:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-[#98d89e] inline-block border border-slate-300"></span>
              <span>Bắt đầu HĐLĐ lần 1</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-[#56bbf1] inline-block border border-slate-300"></span>
              <span>Hết hạn HĐLĐ lần 1</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-[#ea2027] inline-block border border-slate-300"></span>
              <span>HĐLĐ đã quá hạn</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-[#f79f1f] inline-block border border-slate-300"></span>
              <span>HĐ sắp hết hạn (≤60 ngày)</span>
            </div>
          </div>
          <div className="text-slate-500 font-mono text-[11px]">
            Sổ Quản Lý Lao Động - DH Textile
          </div>
        </div>
      </div>
    </div>
  );
};
