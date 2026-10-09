import React from 'react';
import { X, Printer, Edit2, User, Building, Calendar, Award, MapPin, Phone, CreditCard, Clock } from 'lucide-react';
import { Employee } from '../types/employee';
import { formatDateDisplay, getContractExpiryStatus } from '../utils/dateUtils';
import { COMPANY_INFO } from '../data/initialEmployees';

interface EmployeeDetailDrawerProps {
  employee: Employee | null;
  onClose: () => void;
  onEdit: (employee: Employee) => void;
  canViewSalary?: boolean;
}

export const EmployeeDetailDrawer: React.FC<EmployeeDetailDrawerProps> = ({
  employee,
  onClose,
  onEdit,
  canViewSalary = true
}) => {
  if (!employee) return null;

  const expiry = getContractExpiryStatus(employee);
  const isResigned = Boolean(employee.resignationDate);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-lg">
              {employee.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{employee.fullName}</h2>
                <span className="text-xs font-mono font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                  {employee.employeeId}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {employee.position} · {employee.department}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrint}
              title="In trích lục hồ sơ"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEdit(employee)}
              title="Chỉnh sửa"
              className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Callout */}
        <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Trạng thái:</span>
            {isResigned ? (
              <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded">
                Đã thôi việc ({formatDateDisplay(employee.resignationDate)})
              </span>
            ) : (
              <span className="bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded">
                Đang làm việc
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Hạn HĐLĐ:</span>
            <span className={`font-semibold px-2 py-0.5 rounded ${
              expiry.status === 'expired'
                ? 'bg-rose-100 text-rose-700'
                : expiry.status === 'warning'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-slate-100 text-slate-700'
            }`}>
              {expiry.label}
            </span>
          </div>
        </div>

        {/* Drawer Body - Structured Resume View */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Section: Thông tin cá nhân & Nhân thân */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              1. Thông Tin Nhân Thân &amp; Liên Hệ
            </h3>
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 block">Giới tính:</span>
                <span className="font-semibold text-slate-800">{employee.gender === 'Male' ? 'Nam' : 'Nữ'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Ngày sinh:</span>
                <span className="font-semibold text-slate-800 font-mono">{formatDateDisplay(employee.dateOfBirth)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Quốc tịch:</span>
                <span className="font-semibold text-slate-800">{employee.nationality}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Dân tộc:</span>
                <span className="font-semibold text-slate-800">{employee.ethnicity || '-'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 block">Số điện thoại:</span>
                <span className="font-semibold text-slate-800 font-mono">{employee.phoneNumber || '-'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 block">Quê quán:</span>
                <span className="font-semibold text-slate-800">{employee.nativePlace || '-'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 block">Hộ khẩu thường trú:</span>
                <span className="font-semibold text-slate-800">{employee.permanentAddress || '-'}</span>
              </div>
            </div>
          </div>

          {/* Section: Giấy tờ CMND / CCCD */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" />
              2. Giấy Tờ Tùy Thân (CMND/CCCD/Hộ Chiếu)
            </h3>
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 block">Số CMND/CCCD/Passport:</span>
                <span className="font-mono font-bold text-slate-900">{employee.idCardNumber || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Số CMND cũ:</span>
                <span className="font-mono text-slate-600">{employee.oldIdCardNumber || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Ngày cấp:</span>
                <span className="font-mono text-slate-800">{formatDateDisplay(employee.idIssueDate)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Nơi cấp:</span>
                <span className="font-semibold text-slate-800">{employee.idIssuePlace || '-'}</span>
              </div>
            </div>
          </div>

          {/* Section: Chuyên môn & Vị trí */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5" />
              3. Chức Danh &amp; Bộ Phận Công Tác
            </h3>
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 block">Trình độ học vấn:</span>
                <span className="font-semibold text-slate-800">{employee.educationDegree || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Chuyên môn kỹ thuật:</span>
                <span className="font-semibold text-slate-800">{employee.technicalProfession || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Bộ phận (Department):</span>
                <span className="font-bold text-slate-900">{employee.department}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Cấp bậc (Level):</span>
                <span className="font-semibold text-slate-800">{employee.rankLevel || '-'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 block">Vị trí làm việc (Position):</span>
                <span className="font-semibold text-slate-900">{employee.position || '-'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 block">Khu vực làm việc:</span>
                <span className="font-semibold text-slate-800">{employee.workingArea || '-'}</span>
              </div>
            </div>
          </div>

          {/* Section: Hợp đồng & Thời hạn */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              4. Hợp Đồng Lao Động &amp; Thâm Niên
            </h3>
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 block">Loại HĐLĐ:</span>
                <span className="font-semibold text-slate-900">{employee.contractType || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Ngày bắt đầu làm việc:</span>
                <span className="font-mono font-semibold text-slate-800">{formatDateDisplay(employee.joiningDate)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">HĐLĐ Lần 1 (Từ ngày):</span>
                <span className="font-mono text-emerald-800 font-semibold">{formatDateDisplay(employee.contract1StartDate)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Hết hạn HĐLĐ lần 1:</span>
                <span className="font-mono text-sky-800 font-semibold">{formatDateDisplay(employee.contract1EndDate)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Hết hạn HĐLĐ lần 2:</span>
                <span className="font-mono font-bold text-rose-800">{formatDateDisplay(employee.contract2EndDate)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Tổng thâm niên (Tháng):</span>
                <span className="font-mono font-bold text-slate-900 text-sm">{employee.timeOfService} tháng</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 block">Phụ cấp nhà ở:</span>
                <span className="font-semibold text-slate-800">
                  {canViewSalary ? (
                    employee.houseSubsidy || 'Không có'
                  ) : (
                    <span className="text-slate-400 italic font-normal text-xs">*** (Bảo mật - Không có quyền xem)</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Section: Nghỉ việc & Ghi chú */}
          {(employee.resignationDate || employee.remark) && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                5. Thông Tin Thôi Việc &amp; Ghi Chú
              </h3>
              <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                {employee.resignationDate && (
                  <div>
                    <span className="text-slate-500 block">Ngày thôi việc:</span>
                    <span className="font-semibold text-slate-800 font-mono">{formatDateDisplay(employee.resignationDate)}</span>
                  </div>
                )}
                {employee.resignationReason && (
                  <div>
                    <span className="text-slate-500 block">Lý do thôi việc:</span>
                    <span className="font-medium text-slate-700">{employee.resignationReason}</span>
                  </div>
                )}
                {employee.remark && (
                  <div>
                    <span className="text-slate-500 block">Ghi chú:</span>
                    <span className="font-medium text-slate-700">{employee.remark}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Legal Stamp Notice */}
          <div className="border border-slate-200 p-3 rounded-lg text-slate-500 text-[11px] leading-relaxed">
            Trích lục từ <strong>Sổ Quản Lý Lao Động</strong> của {COMPANY_INFO.name}. Hồ sơ được lưu trữ và cập nhật định kỳ theo Điều 12 Bộ Luật Lao Động.
          </div>
        </div>
      </div>
    </div>
  );
};
