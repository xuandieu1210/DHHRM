import React, { useState, useEffect } from 'react';
import { X, User, FileText, Briefcase, Calendar, FileQuestion, Check } from 'lucide-react';
import { Employee, Gender } from '../types/employee';
import { calculateMonthsOfService } from '../utils/dateUtils';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (employee: Employee) => void;
  initialData?: Employee | null;
  existingCount: number;
  canViewSalary?: boolean;
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  existingCount,
  canViewSalary = true
}) => {
  const [activeTab, setActiveTab] = useState<'personal' | 'idcard' | 'job' | 'contract' | 'resignation'>('personal');

  const [formData, setFormData] = useState<Partial<Employee>>({
    fullName: '',
    gender: 'Male',
    employeeId: `DH${1000 + existingCount + 1}`,
    dateOfBirth: '',
    nationality: 'Việt Nam',
    ethnicity: 'Kinh',
    nativePlace: '',
    permanentAddress: '',
    phoneNumber: '',
    idCardNumber: '',
    oldIdCardNumber: '',
    idIssueDate: '',
    idIssuePlace: 'Cục CSQLHC về TTXH',
    educationDegree: 'Đại học',
    technicalProfession: '',
    rankLevel: 'Staff',
    workingArea: 'Xưởng sản xuất',
    position: '',
    department: 'Sản xuất',
    contractType: '1 year',
    contract1StartDate: '',
    contract1EndDate: '',
    contract2EndDate: '',
    joiningDate: '',
    timeOfService: 0,
    resignationDate: '',
    resignationReason: '',
    houseSubsidy: '',
    remark: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({ ...initialData });
    } else {
      setFormData({
        fullName: '',
        gender: 'Male',
        employeeId: `DH${1000 + existingCount + 1}`,
        dateOfBirth: '',
        nationality: 'Việt Nam',
        ethnicity: 'Kinh',
        nativePlace: '',
        permanentAddress: '',
        phoneNumber: '',
        idCardNumber: '',
        oldIdCardNumber: '',
        idIssueDate: '',
        idIssuePlace: 'Cục CSQLHC về TTXH',
        educationDegree: 'Đại học',
        technicalProfession: '',
        rankLevel: 'Staff',
        workingArea: 'Xưởng sản xuất',
        position: '',
        department: 'Sản xuất',
        contractType: '1 year',
        contract1StartDate: '',
        contract1EndDate: '',
        contract2EndDate: '',
        joiningDate: '',
        timeOfService: 0,
        resignationDate: '',
        resignationReason: '',
        houseSubsidy: '',
        remark: ''
      });
    }
    setErrors({});
    setActiveTab('personal');
  }, [initialData, existingCount, isOpen]);

  // Auto calculate time of service when joiningDate or resignationDate changes
  const handleJoiningDateChange = (dateVal: string) => {
    const months = calculateMonthsOfService(dateVal, formData.resignationDate);
    setFormData(prev => ({
      ...prev,
      joiningDate: dateVal,
      timeOfService: months
    }));
  };

  const handleChange = (field: keyof Employee, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.fullName || formData.fullName.trim() === '') {
      newErrors.fullName = 'Vui lòng nhập Họ và Tên';
    }
    if (!formData.employeeId || formData.employeeId.trim() === '') {
      newErrors.employeeId = 'Vui lòng nhập Mã số nhân viên';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setActiveTab('personal');
      return;
    }

    const employeeToSave: Employee = {
      id: initialData?.id || `emp-${Date.now()}`,
      stt: initialData?.stt || existingCount + 1,
      fullName: formData.fullName || '',
      gender: (formData.gender as Gender) || 'Male',
      employeeId: formData.employeeId || '',
      dateOfBirth: formData.dateOfBirth || '',
      nationality: formData.nationality || 'Việt Nam',
      ethnicity: formData.ethnicity || '',
      nativePlace: formData.nativePlace || '',
      permanentAddress: formData.permanentAddress || '',
      phoneNumber: formData.phoneNumber || '',
      idCardNumber: formData.idCardNumber || '',
      oldIdCardNumber: formData.oldIdCardNumber || '',
      idIssueDate: formData.idIssueDate || '',
      idIssuePlace: formData.idIssuePlace || '',
      educationDegree: formData.educationDegree || '',
      technicalProfession: formData.technicalProfession || '',
      rankLevel: formData.rankLevel || '',
      workingArea: formData.workingArea || '',
      position: formData.position || '',
      department: formData.department || '',
      contractType: formData.contractType || '',
      contract1StartDate: formData.contract1StartDate || '',
      contract1EndDate: formData.contract1EndDate || '',
      contract2EndDate: formData.contract2EndDate || '',
      joiningDate: formData.joiningDate || '',
      timeOfService: formData.timeOfService !== undefined ? formData.timeOfService : 0,
      resignationDate: formData.resignationDate || '',
      resignationReason: formData.resignationReason || '',
      houseSubsidy: formData.houseSubsidy || '',
      remark: formData.remark || ''
    };

    onSave(employeeToSave);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              {initialData ? 'Chỉnh Sửa Hồ Sơ Lao Động' : 'Thêm Nhân Viên Mới Vào Sổ Lao Động'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Cơ quan: Công ty TNHH DH Textile - KCN Tam Thăng
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="px-6 border-b border-slate-200 bg-white flex space-x-4 overflow-x-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('personal')}
            className={`py-3 flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'personal'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            1. Thông Tin Cá Nhân
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('idcard')}
            className={`py-3 flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'idcard'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            2. Giấy Tờ Tùy Thân (CMND/CCCD)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('job')}
            className={`py-3 flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'job'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            3. Chuyên Môn &amp; Vị Trí
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('contract')}
            className={`py-3 flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'contract'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            4. Hợp Đồng &amp; Thâm Niên
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('resignation')}
            className={`py-3 flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'resignation'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileQuestion className="w-3.5 h-3.5" />
            5. Nghỉ Việc &amp; Ghi Chú
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* TAB 1: THÔNG TIN CÁ NHÂN */}
          {activeTab === 'personal' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Họ và tên (Full Name) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  placeholder="VD: Deokyun Han, Nguyễn Văn An..."
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none ${
                    errors.fullName ? 'border-red-500' : 'border-slate-300'
                  }`}
                />
                {errors.fullName && <p className="text-red-500 text-[11px] mt-0.5">{errors.fullName}</p>}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mã số nhân viên (Emp. ID) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.employeeId}
                  onChange={(e) => handleChange('employeeId', e.target.value)}
                  placeholder="VD: DH1001"
                  className={`w-full px-3 py-2 border font-mono font-bold rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none ${
                    errors.employeeId ? 'border-red-500' : 'border-slate-300'
                  }`}
                />
                {errors.employeeId && <p className="text-red-500 text-[11px] mt-0.5">{errors.employeeId}</p>}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Giới tính (Gender)
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleChange('gender', e.target.value as Gender)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                >
                  <option value="Male">Nam (Male)</option>
                  <option value="Female">Nữ (Female)</option>
                  <option value="Other">Khác</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ngày sinh (DOB)
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Số điện thoại (Phone)
                </label>
                <input
                  type="text"
                  value={formData.phoneNumber}
                  onChange={(e) => handleChange('phoneNumber', e.target.value)}
                  placeholder="VD: 0905123456"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Quốc tịch (Nationality)
                </label>
                <input
                  type="text"
                  value={formData.nationality}
                  onChange={(e) => handleChange('nationality', e.target.value)}
                  placeholder="VD: Việt Nam, Hàn Quốc..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Dân tộc (Ethnicity)
                </label>
                <input
                  type="text"
                  value={formData.ethnicity}
                  onChange={(e) => handleChange('ethnicity', e.target.value)}
                  placeholder="VD: Kinh, Tày..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Quê quán (Native place)
                </label>
                <input
                  type="text"
                  value={formData.nativePlace}
                  onChange={(e) => handleChange('nativePlace', e.target.value)}
                  placeholder="VD: Tam Kỳ, Quảng Nam..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block font-semibold text-slate-700 mb-1">
                  Hộ khẩu thường trú (Permanent Address)
                </label>
                <input
                  type="text"
                  value={formData.permanentAddress}
                  onChange={(e) => handleChange('permanentAddress', e.target.value)}
                  placeholder="VD: Lô D4, KCN Tam Thăng / Xã Tam Thăng, TP Tam Kỳ, Quảng Nam"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* TAB 2: GIẤY TỜ TÙY THÂN */}
          {activeTab === 'idcard' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Số CMND/CCCD / Hộ chiếu (ID Card / Passport)
                </label>
                <input
                  type="text"
                  value={formData.idCardNumber}
                  onChange={(e) => handleChange('idCardNumber', e.target.value)}
                  placeholder="VD: 049085002341 hoặc M08769215"
                  className="w-full px-3 py-2 border border-slate-300 font-mono rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Số CMND cũ (nếu có)
                </label>
                <input
                  type="text"
                  value={formData.oldIdCardNumber}
                  onChange={(e) => handleChange('oldIdCardNumber', e.target.value)}
                  placeholder="VD: 205342119"
                  className="w-full px-3 py-2 border border-slate-300 font-mono rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ngày cấp (Issue date of ID card)
                </label>
                <input
                  type="date"
                  value={formData.idIssueDate}
                  onChange={(e) => handleChange('idIssueDate', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nơi cấp (Place of issue)
                </label>
                <input
                  type="text"
                  value={formData.idIssuePlace}
                  onChange={(e) => handleChange('idIssuePlace', e.target.value)}
                  placeholder="VD: Cục CSQLHC về TTXH, Bộ ngoại giao HQ..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* TAB 3: CHUYÊN MÔN & VỊ TRÍ */}
          {activeTab === 'job' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Trình độ (Degree)
                </label>
                <select
                  value={formData.educationDegree}
                  onChange={(e) => handleChange('educationDegree', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                >
                  <option value="University">University (Đại học)</option>
                  <option value="College">College (Cao đẳng)</option>
                  <option value="Intermediate">Trung cấp</option>
                  <option value="High School">THPT</option>
                  <option value="Postgraduate">Sau đại học / Thạc sĩ</option>
                  <option value="Lao động phổ thông">Lao động phổ thông</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Chuyên môn kỹ thuật (Profession)
                </label>
                <input
                  type="text"
                  value={formData.technicalProfession}
                  onChange={(e) => handleChange('technicalProfession', e.target.value)}
                  placeholder="VD: Quản trị kinh doanh, Kỹ thuật may..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Cấp bậc (Level)
                </label>
                <input
                  type="text"
                  value={formData.rankLevel}
                  onChange={(e) => handleChange('rankLevel', e.target.value)}
                  placeholder="VD: General Director, Manager, Worker..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Bộ phận (Department)
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => handleChange('department', e.target.value)}
                  placeholder="VD: BOD, HR & Admin, Production, QC..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Vị trí làm việc (Position)
                </label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => handleChange('position', e.target.value)}
                  placeholder="VD: Nhà quản lý/Tổng giám đốc, Quản đốc..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Khu vực làm việc (Working Area)
                </label>
                <input
                  type="text"
                  value={formData.workingArea}
                  onChange={(e) => handleChange('workingArea', e.target.value)}
                  placeholder="VD: Xưởng may 01, Tòa văn phòng, Kho..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* TAB 4: HỢP ĐỒNG & THÂM NIÊN */}
          {activeTab === 'contract' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Loại HĐLĐ (Contract type)
                </label>
                <select
                  value={formData.contractType}
                  onChange={(e) => handleChange('contractType', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                >
                  <option value="2 years">2 years (HĐLĐ 2 năm)</option>
                  <option value="1 year">1 year (HĐLĐ 1 năm)</option>
                  <option value="3 years">3 years (HĐLĐ 3 năm)</option>
                  <option value="Không xác định thời hạn">Không xác định thời hạn</option>
                  <option value="Thử việc">Thử việc (Probation)</option>
                  <option value="Mùa vụ">Thời vụ / Dưới 12 tháng</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ngày bắt đầu làm việc (Joining date)
                </label>
                <input
                  type="date"
                  value={formData.joiningDate}
                  onChange={(e) => handleJoiningDateChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Thời gian làm việc / Thâm niên (Tháng)
                </label>
                <input
                  type="number"
                  value={formData.timeOfService}
                  onChange={(e) => handleChange('timeOfService', Number(e.target.value))}
                  placeholder="VD: 83"
                  className="w-full px-3 py-2 border border-slate-300 font-mono font-bold rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400">Tự động tính từ ngày bắt đầu vào làm việc</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  HĐLĐ Lần 1 - Bắt đầu (Start 1st contract)
                </label>
                <input
                  type="date"
                  value={formData.contract1StartDate}
                  onChange={(e) => handleChange('contract1StartDate', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Hết hạn HĐLĐ lần 1 (End date 1st contract)
                </label>
                <input
                  type="date"
                  value={formData.contract1EndDate}
                  onChange={(e) => handleChange('contract1EndDate', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Hết hạn HĐLĐ lần 2 (End date 2nd contract)
                </label>
                <input
                  type="date"
                  value={formData.contract2EndDate}
                  onChange={(e) => handleChange('contract2EndDate', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Phụ cấp nhà ở (House Subsidy)
                </label>
                {canViewSalary ? (
                  <input
                    type="text"
                    value={formData.houseSubsidy}
                    onChange={(e) => handleChange('houseSubsidy', e.target.value)}
                    placeholder="VD: 5,000,000 VND"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                ) : (
                  <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-400 italic font-mono text-xs select-none">
                    *** (Bảo mật - Không có quyền xem)
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: NGHỈ VIỆC & GHI CHÚ */}
          {activeTab === 'resignation' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ngày nghỉ việc (Resignation date)
                </label>
                <input
                  type="date"
                  value={formData.resignationDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    const months = calculateMonthsOfService(formData.joiningDate, val);
                    setFormData(prev => ({ ...prev, resignationDate: val, timeOfService: months }));
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400">Để trống nếu nhân viên đang làm việc</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Lý do nghỉ việc (Resignation Reason)
                </label>
                <input
                  type="text"
                  value={formData.resignationReason}
                  onChange={(e) => handleChange('resignationReason', e.target.value)}
                  placeholder="VD: Hết hạn HĐLĐ, Đơn phương chấm dứt theo nguyện vọng..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Ghi chú (Remark)
                </label>
                <textarea
                  rows={3}
                  value={formData.remark}
                  onChange={(e) => handleChange('remark', e.target.value)}
                  placeholder="VD: Người đại diện theo pháp luật / Chứng chỉ chuyên môn..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Hủy Bỏ
            </button>

            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>{initialData ? 'Lưu Thay Đổi' : 'Thêm Nhân Viên'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
