import React, { useState, useMemo } from 'react';
import { DollarSign, Plus, Search, Filter, Download, Edit3, Trash2, Printer, Eye, Calculator, ArrowUpRight, Building2, Check, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { EmployeeSalary } from '../types/salary';
import { Employee } from '../types/employee';
import { COMPANY_INFO } from '../data/initialEmployees';

interface SalaryManagementProps {
  salaries: EmployeeSalary[];
  employees: Employee[];
  onSaveSalary: (salary: EmployeeSalary) => void;
  onDeleteSalary: (id: string) => void;
  canEditSalary: boolean;
  canExportExcel: boolean;
}

export const SalaryManagement: React.FC<SalaryManagementProps> = ({
  salaries,
  employees,
  onSaveSalary,
  onDeleteSalary,
  canEditSalary,
  canExportExcel
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [currencyFilter, setCurrencyFilter] = useState<'all' | 'USD' | 'VND'>('all');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSalary, setEditingSalary] = useState<EmployeeSalary | null>(null);
  const [payslipSalary, setPayslipSalary] = useState<EmployeeSalary | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<EmployeeSalary>>({
    employeeId: '',
    fullName: '',
    department: 'Production',
    position: '',
    currency: 'VND',
    basicSalary: 8000000,
    positionAllowance: 0,
    responsibleAllowance: 0,
    petrolSubsidy: 500000,
    phoneSubsidy: 0,
    languageSubsidy: 0,
    regulationSubsidy: 500000,
    uniformSubsidy: 300000,
    abilityAllowance: 0,
    houseSubsidy: 0,
    transportationSubsidy: 0,
    livingExpenseSubsidy: 0,
    mealAllowance: 800000,
    effectiveDate: '2026-01-01',
    notes: ''
  });

  // Extract departments
  const departments = useMemo(() => {
    const set = new Set(salaries.map(s => s.department).filter(Boolean));
    return Array.from(set);
  }, [salaries]);

  // Filtered Salaries
  const filteredSalaries = useMemo(() => {
    return salaries.filter(s => {
      if (deptFilter !== 'all' && s.department !== deptFilter) return false;
      if (currencyFilter !== 'all' && s.currency !== currencyFilter) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const mName = s.fullName.toLowerCase().includes(term);
        const mId = s.employeeId.toLowerCase().includes(term);
        const mPos = s.position.toLowerCase().includes(term);
        if (!mName && !mId && !mPos) return false;
      }
      return true;
    });
  }, [salaries, deptFilter, currencyFilter, searchTerm]);

  // Aggregate Metrics
  const totalUsdPayroll = salaries.filter(s => s.currency === 'USD').reduce((sum, s) => sum + s.totalSalary, 0);
  const totalVndPayroll = salaries.filter(s => s.currency === 'VND').reduce((sum, s) => sum + s.totalSalary, 0);
  const totalUsdAllowances = salaries.filter(s => s.currency === 'USD').reduce((sum, s) => sum + s.totalAllowance, 0);
  const totalVndAllowances = salaries.filter(s => s.currency === 'VND').reduce((sum, s) => sum + s.totalAllowance, 0);

  // Currency Formatter
  const formatSalaryNumber = (num: number, currency: 'USD' | 'VND') => {
    if (!num || num === 0) return '-';
    return num.toLocaleString('en-US');
  };

  // Calculate live totals for modal
  const liveTotalAllowance = (
    Number(formData.positionAllowance || 0) +
    Number(formData.responsibleAllowance || 0) +
    Number(formData.petrolSubsidy || 0) +
    Number(formData.phoneSubsidy || 0) +
    Number(formData.languageSubsidy || 0) +
    Number(formData.regulationSubsidy || 0) +
    Number(formData.uniformSubsidy || 0) +
    Number(formData.abilityAllowance || 0) +
    Number(formData.houseSubsidy || 0) +
    Number(formData.transportationSubsidy || 0) +
    Number(formData.livingExpenseSubsidy || 0) +
    Number(formData.mealAllowance || 0)
  );

  const liveTotalSalary = Number(formData.basicSalary || 0) + liveTotalAllowance;

  // Form Handlers
  const handleOpenAdd = () => {
    setEditingSalary(null);
    setFormData({
      employeeId: employees[0]?.employeeId || 'DH1001',
      fullName: employees[0]?.fullName || '',
      department: employees[0]?.department || 'Production',
      position: employees[0]?.position || '',
      currency: 'VND',
      basicSalary: 8000000,
      positionAllowance: 0,
      responsibleAllowance: 0,
      petrolSubsidy: 500000,
      phoneSubsidy: 0,
      languageSubsidy: 0,
      regulationSubsidy: 500000,
      uniformSubsidy: 300000,
      abilityAllowance: 0,
      houseSubsidy: 0,
      transportationSubsidy: 0,
      livingExpenseSubsidy: 0,
      mealAllowance: 800000,
      effectiveDate: '2026-01-01',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (salary: EmployeeSalary) => {
    setEditingSalary(salary);
    setFormData({ ...salary });
    setIsModalOpen(true);
  };

  const handleEmployeeSelect = (empId: string) => {
    const emp = employees.find(e => e.employeeId === empId);
    if (emp) {
      setFormData(prev => ({
        ...prev,
        employeeId: emp.employeeId,
        fullName: emp.fullName,
        department: emp.department,
        position: emp.position
      }));
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.fullName) return;

    const salaryToSave: EmployeeSalary = {
      id: editingSalary?.id || `sal-${Date.now()}`,
      employeeId: formData.employeeId || '',
      fullName: formData.fullName || '',
      department: formData.department || 'Production',
      position: formData.position || '',
      currency: formData.currency || 'VND',
      basicSalary: Number(formData.basicSalary || 0),
      positionAllowance: Number(formData.positionAllowance || 0),
      responsibleAllowance: Number(formData.responsibleAllowance || 0),
      petrolSubsidy: Number(formData.petrolSubsidy || 0),
      phoneSubsidy: Number(formData.phoneSubsidy || 0),
      languageSubsidy: Number(formData.languageSubsidy || 0),
      regulationSubsidy: Number(formData.regulationSubsidy || 0),
      uniformSubsidy: Number(formData.uniformSubsidy || 0),
      abilityAllowance: Number(formData.abilityAllowance || 0),
      houseSubsidy: Number(formData.houseSubsidy || 0),
      transportationSubsidy: Number(formData.transportationSubsidy || 0),
      livingExpenseSubsidy: Number(formData.livingExpenseSubsidy || 0),
      mealAllowance: Number(formData.mealAllowance || 0),
      totalAllowance: liveTotalAllowance,
      totalSalary: liveTotalSalary,
      effectiveDate: formData.effectiveDate || '2026-01-01',
      notes: formData.notes || ''
    };

    onSaveSalary(salaryToSave);
    setIsModalOpen(false);
  };

  // Export to Excel with exact columns
  const handleExportExcel = () => {
    const headers = [
      ['CÔNG TY TNHH DH TEXTILE - BẢNG LƯƠNG & PHỤ CẤP LAO ĐỘNG'],
      ['Địa chỉ: ' + COMPANY_INFO.address],
      [],
      // Row 4: Multi-column Group Header
      [
        'STT',
        'MÃ NV',
        'HỌ VÀ TÊN',
        'BỘ PHẬN',
        'VỊ TRÍ LÀM VIỆC',
        'ĐƠN VỊ TIỀN',
        'Total salary\nTổng lương',
        'Basic Salary\nLương cơ bản',
        'Allowance & Subsidy / Các khoản phụ cấp, trợ cấp',
        '', '', '', '', '', '', '', '', '', '', ''
      ],
      // Row 5: Sub Headers
      [
        '', '', '', '', '', '', '', '',
        'Position Allowance\nPhụ cấp chức vụ',
        'Responsible Allowance\nPhụ cấp trách nhiệm',
        'Petrol Subsidy\nTrợ cấp xăng xe',
        'Phone Subsidy\nTrợ cấp điện thoại',
        'Language Subsidy\nTrợ cấp ngôn ngữ',
        'Regulation compliance subsidy\nTrợ cấp nội quy',
        'Uniform subsidy\nHỗ trợ trang phục',
        'Ability allowance\nTrợ cấp đánh giá năng lực',
        'House Subsidy\nTrợ cấp nhà ở',
        'Transportation fee Subsidy\nTrợ cấp về nước thăm thân',
        'Living expense Subsidy\nTrợ cấp xa nhà',
        'Meal allowance\nHỗ trợ tiền ăn'
      ]
    ];

    const dataRows = salaries.map((s, idx) => [
      idx + 1,
      s.employeeId,
      s.fullName,
      s.department,
      s.position,
      s.currency,
      s.totalSalary,
      s.basicSalary,
      s.positionAllowance,
      s.responsibleAllowance,
      s.petrolSubsidy,
      s.phoneSubsidy,
      s.languageSubsidy,
      s.regulationSubsidy,
      s.uniformSubsidy,
      s.abilityAllowance,
      s.houseSubsidy,
      s.transportationSubsidy,
      s.livingExpenseSubsidy,
      s.mealAllowance
    ]);

    const ws = XLSX.utils.aoa_to_sheet([...headers, ...dataRows]);
    ws['!merges'] = [
      { s: { r: 3, c: 8 }, e: { r: 3, c: 19 } } // Merge "Allowance & Subsidy"
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bang_Luong');
    XLSX.writeFile(wb, 'Bang_Luong_DH_Textile.xlsx');
  };

  return (
    <div className="space-y-6">
      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* KPI 1: Total Payroll VND */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Tổng quỹ lương (VND)</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {totalVndPayroll.toLocaleString('en-US')} <span className="text-xs font-normal text-slate-500">đ</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Phụ cấp chi trả: {totalVndAllowances.toLocaleString('en-US')} đ
          </div>
        </div>

        {/* KPI 2: Total Payroll USD (Chuyên gia nước ngoài) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Quỹ lương Expat (USD)</span>
            <DollarSign className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold font-mono text-indigo-900 tabular-nums">
            ${totalUsdPayroll.toLocaleString('en-US')}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Phụ cấp &amp; Thăm thân: ${totalUsdAllowances.toLocaleString('en-US')}
          </div>
        </div>

        {/* KPI 3: Total Employees on Payroll */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Số lao động trên bảng lương</span>
            <Building2 className="w-4 h-4 text-slate-600" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {salaries.length} <span className="text-xs font-normal text-slate-500">người</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Đã thiết lập định mức lương &amp; phụ cấp
          </div>
        </div>

        {/* KPI 4: Max Salary Reference */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Mức lương chuyên gia cao nhất</span>
            <ArrowUpRight className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold font-mono text-slate-900 tabular-nums">
            $12,000 / tháng
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Deokyun Han (General Director)
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-md w-full">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo Tên nhân viên, Mã NV (DH...), Vị trí..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 font-medium"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Dept filter */}
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none"
          >
            <option value="all">Tất cả bộ phận</option>
            {departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Currency filter */}
          <select
            value={currencyFilter}
            onChange={(e) => setCurrencyFilter(e.target.value as any)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none"
          >
            <option value="all">Tất cả tiền tệ</option>
            <option value="USD">USD (Chuyên gia HQ)</option>
            <option value="VND">VND (Việt Nam)</option>
          </select>

          {canEditSalary && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3.5 py-2 font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thiết Lập Biểu Lương</span>
            </button>
          )}

          {canExportExcel && (
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3.5 py-2 font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất Bảng Lương Excel</span>
            </button>
          )}
        </div>
      </div>

      {/* Official Salary Table Matching The Image */}
      <div className="bg-white rounded-xl border border-slate-300 shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[72vh]">
          <table className="w-full text-xs text-left border-collapse border border-slate-300">
            {/* 2-Level Header Structure Matching Image */}
            <thead className="sticky top-0 z-20 bg-slate-200 text-slate-900 select-none">
              {/* Row 1: High Level Headers */}
              <tr className="border-b border-slate-300 text-center font-bold">
                <th rowSpan={2} className="p-2 border border-slate-300 whitespace-nowrap bg-slate-200 min-w-[50px]">
                  STT
                </th>
                <th rowSpan={2} className="p-2 border border-slate-300 whitespace-nowrap bg-slate-200 min-w-[85px]">
                  MÃ NV
                </th>
                <th rowSpan={2} className="p-2 border border-slate-300 whitespace-nowrap bg-slate-200 text-left min-w-[150px] sticky left-0 z-30">
                  HỌ VÀ TÊN
                </th>
                <th rowSpan={2} className="p-2 border border-slate-300 whitespace-nowrap bg-slate-200 min-w-[100px]">
                  BỘ PHẬN
                </th>

                {/* Total Salary Column Header */}
                <th rowSpan={2} className="p-2.5 border border-slate-300 whitespace-nowrap bg-slate-300 text-center min-w-[110px]">
                  <div className="font-bold text-[13px] text-slate-900">Total salary</div>
                  <div className="font-normal italic text-[11px] text-slate-700">Tổng lương</div>
                </th>

                {/* Basic Salary Column Header */}
                <th rowSpan={2} className="p-2.5 border border-slate-300 whitespace-nowrap bg-slate-200 text-center min-w-[110px]">
                  <div className="font-bold text-[13px] text-slate-900">Basic Salary</div>
                  <div className="font-normal italic text-[11px] text-slate-700">Lương cơ bản</div>
                </th>

                {/* Allowance & Subsidy Group Header (Spanning all 12 sub columns) */}
                <th colSpan={12} className="p-2 border border-slate-300 whitespace-nowrap bg-slate-300 text-center">
                  <div className="font-bold text-[13px] tracking-wide text-slate-900">Allowance &amp; Subsidy</div>
                  <div className="font-normal italic text-[11px] text-slate-700">Các khoản phụ cấp, trợ cấp</div>
                </th>

                <th rowSpan={2} className="p-2 border border-slate-300 whitespace-nowrap bg-slate-200 text-center min-w-[90px] sticky right-0 z-30">
                  THAO TÁC
                </th>
              </tr>

              {/* Row 2: Sub Headers for Allowance & Subsidy */}
              <tr className="border-b border-slate-400 text-center text-[11px] font-semibold bg-slate-100">
                {/* 1. Position Allowance */}
                <th className="p-2 border border-slate-300 min-w-[100px] leading-tight">
                  <div>Position Allowance</div>
                  <div className="font-normal italic text-[10px] text-slate-600">Phụ cấp chức vụ</div>
                </th>

                {/* 2. Responsible Allowance */}
                <th className="p-2 border border-slate-300 min-w-[100px] leading-tight">
                  <div>Responsible Allowance</div>
                  <div className="font-normal italic text-[10px] text-slate-600">Phụ cấp trách nhiệm</div>
                </th>

                {/* 3. Petrol Subsidy */}
                <th className="p-2 border border-slate-300 min-w-[95px] leading-tight">
                  <div>Petrol Subsidy</div>
                  <div className="font-normal italic text-[10px] text-slate-600">Trợ cấp xăng xe</div>
                </th>

                {/* 4. Phone Subsidy */}
                <th className="p-2 border border-slate-300 min-w-[95px] leading-tight">
                  <div>Phone Subsidy</div>
                  <div className="font-normal italic text-[10px] text-slate-600">Trợ cấp điện thoại</div>
                </th>

                {/* 5. Language Subsidy */}
                <th className="p-2 border border-slate-300 min-w-[95px] leading-tight">
                  <div>Language Subsidy</div>
                  <div className="font-normal italic text-[10px] text-slate-600">Trợ cấp ngôn ngữ</div>
                </th>

                {/* 6. Regulation compliance subsidy */}
                <th className="p-2 border border-slate-300 min-w-[100px] leading-tight">
                  <div>Regulation compliance</div>
                  <div className="font-normal italic text-[10px] text-slate-600">Trợ cấp nội quy</div>
                </th>

                {/* 7. Uniform subsidy */}
                <th className="p-2 border border-slate-300 min-w-[95px] leading-tight">
                  <div>Uniform subsidy</div>
                  <div className="font-normal italic text-[10px] text-slate-600">Hỗ trợ trang phục</div>
                </th>

                {/* 8. Ability allowance */}
                <th className="p-2 border border-slate-300 min-w-[100px] leading-tight">
                  <div>Ability allowance</div>
                  <div className="font-normal italic text-[10px] text-slate-600">Trợ cấp năng lực</div>
                </th>

                {/* 9. House Subsidy */}
                <th className="p-2 border border-slate-300 min-w-[95px] leading-tight">
                  <div>House Subsidy</div>
                  <div className="font-normal italic text-[10px] text-slate-600">Trợ cấp nhà ở</div>
                </th>

                {/* 10. Transportation fee Subsidy */}
                <th className="p-2 border border-slate-300 min-w-[110px] leading-tight">
                  <div>Transportation fee Subsidy</div>
                  <div className="font-normal italic text-[10px] text-slate-600">Trợ cấp thăm thân</div>
                </th>

                {/* 11. Living expense Subsidy */}
                <th className="p-2 border border-slate-300 min-w-[100px] leading-tight">
                  <div>Living expense Subsidy</div>
                  <div className="font-normal italic text-[10px] text-slate-600">Trợ cấp xa nhà</div>
                </th>

                {/* 12. Meal allowance */}
                <th className="p-2 border border-slate-300 min-w-[95px] leading-tight">
                  <div>Meal allowance</div>
                  <div className="font-normal italic text-[10px] text-slate-600">Hỗ trợ tiền ăn</div>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {filteredSalaries.length === 0 ? (
                <tr>
                  <td colSpan={19} className="py-12 text-center text-slate-500">
                    Không tìm thấy dữ liệu lương phù hợp.
                  </td>
                </tr>
              ) : (
                filteredSalaries.map((sal, idx) => (
                  <tr key={sal.id} className="hover:bg-slate-50/90 transition-colors">
                    {/* STT */}
                    <td className="p-2 text-center font-mono text-slate-500 border border-slate-300 font-medium">
                      {idx + 1}
                    </td>

                    {/* Mã NV */}
                    <td className="p-2 text-center font-mono font-bold text-slate-900 border border-slate-300">
                      {sal.employeeId}
                    </td>

                    {/* Họ và tên */}
                    <td className="p-2 font-bold text-slate-900 border border-slate-300 sticky left-0 bg-white z-10 whitespace-nowrap">
                      {sal.fullName}
                      <span className="block text-[10px] font-normal text-slate-500">{sal.position}</span>
                    </td>

                    {/* Bộ phận */}
                    <td className="p-2 text-slate-700 border border-slate-300 whitespace-nowrap">
                      {sal.department}
                    </td>

                    {/* Total Salary (Bold, prominent like in image) */}
                    <td className="p-2 text-right font-mono font-bold text-slate-900 text-sm border border-slate-300 bg-slate-50 tabular-nums whitespace-nowrap">
                      {sal.currency === 'USD' && '$'}
                      {sal.totalSalary.toLocaleString('en-US')}
                      {sal.currency === 'VND' && <span className="text-[10px] font-normal ml-0.5 text-slate-500">đ</span>}
                    </td>

                    {/* Basic Salary */}
                    <td className="p-2 text-right font-mono font-semibold text-slate-800 border border-slate-300 tabular-nums whitespace-nowrap">
                      {sal.currency === 'USD' && '$'}
                      {sal.basicSalary.toLocaleString('en-US')}
                      {sal.currency === 'VND' && <span className="text-[10px] font-normal ml-0.5 text-slate-500">đ</span>}
                    </td>

                    {/* 1. Position Allowance */}
                    <td className="p-2 text-right font-mono text-slate-700 border border-slate-300 tabular-nums whitespace-nowrap">
                      {formatSalaryNumber(sal.positionAllowance, sal.currency)}
                    </td>

                    {/* 2. Responsible Allowance */}
                    <td className="p-2 text-right font-mono text-slate-700 border border-slate-300 tabular-nums whitespace-nowrap">
                      {formatSalaryNumber(sal.responsibleAllowance, sal.currency)}
                    </td>

                    {/* 3. Petrol Subsidy */}
                    <td className="p-2 text-right font-mono text-slate-700 border border-slate-300 tabular-nums whitespace-nowrap">
                      {formatSalaryNumber(sal.petrolSubsidy, sal.currency)}
                    </td>

                    {/* 4. Phone Subsidy */}
                    <td className="p-2 text-right font-mono text-slate-700 border border-slate-300 tabular-nums whitespace-nowrap">
                      {formatSalaryNumber(sal.phoneSubsidy, sal.currency)}
                    </td>

                    {/* 5. Language Subsidy */}
                    <td className="p-2 text-right font-mono text-slate-700 border border-slate-300 tabular-nums whitespace-nowrap">
                      {formatSalaryNumber(sal.languageSubsidy, sal.currency)}
                    </td>

                    {/* 6. Regulation compliance */}
                    <td className="p-2 text-right font-mono text-slate-700 border border-slate-300 tabular-nums whitespace-nowrap">
                      {formatSalaryNumber(sal.regulationSubsidy, sal.currency)}
                    </td>

                    {/* 7. Uniform subsidy */}
                    <td className="p-2 text-right font-mono text-slate-700 border border-slate-300 tabular-nums whitespace-nowrap">
                      {formatSalaryNumber(sal.uniformSubsidy, sal.currency)}
                    </td>

                    {/* 8. Ability allowance */}
                    <td className="p-2 text-right font-mono text-slate-700 border border-slate-300 tabular-nums whitespace-nowrap">
                      {formatSalaryNumber(sal.abilityAllowance, sal.currency)}
                    </td>

                    {/* 9. House Subsidy */}
                    <td className="p-2 text-right font-mono text-slate-700 border border-slate-300 tabular-nums whitespace-nowrap">
                      {formatSalaryNumber(sal.houseSubsidy, sal.currency)}
                    </td>

                    {/* 10. Transportation fee Subsidy */}
                    <td className="p-2 text-right font-mono text-slate-700 border border-slate-300 tabular-nums whitespace-nowrap">
                      {formatSalaryNumber(sal.transportationSubsidy, sal.currency)}
                    </td>

                    {/* 11. Living expense Subsidy */}
                    <td className="p-2 text-right font-mono text-slate-700 border border-slate-300 tabular-nums whitespace-nowrap">
                      {formatSalaryNumber(sal.livingExpenseSubsidy, sal.currency)}
                    </td>

                    {/* 12. Meal allowance */}
                    <td className="p-2 text-right font-mono text-slate-700 border border-slate-300 tabular-nums whitespace-nowrap">
                      {formatSalaryNumber(sal.mealAllowance, sal.currency)}
                    </td>

                    {/* Actions */}
                    <td className="p-2 text-center border border-slate-300 sticky right-0 bg-white z-10 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setPayslipSalary(sal)}
                          title="In phiếu lương cá nhân"
                          className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {canEditSalary && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(sal)}
                              title="Chỉnh sửa định mức lương"
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                if (window.confirm(`Xóa biểu lương của nhân viên ${sal.fullName} (${sal.employeeId})?`)) {
                                  onDeleteSalary(sal.id);
                                }
                              }}
                              title="Xóa bản ghi lương"
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Salary Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-indigo-600" />
                  {editingSalary ? 'Điều Chỉnh Định Mức Lương & Phụ Cấp' : 'Thiết Lập Biểu Lương Nhân Viên Mới'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tự động tổng hợp Tổng lương = Lương cơ bản + 12 khoản phụ cấp &amp; trợ cấp.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveForm} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {/* Employee Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Chọn Nhân Viên <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.employeeId}
                    onChange={(e) => handleEmployeeSelect(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 focus:outline-none"
                  >
                    {employees.map(e => (
                      <option key={e.employeeId} value={e.employeeId}>
                        {e.employeeId} - {e.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Họ và tên</label>
                  <input
                    type="text"
                    readOnly
                    value={formData.fullName}
                    className="w-full px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-lg font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tiền tệ chi trả</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value as any }))}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 focus:outline-none"
                  >
                    <option value="VND">VND (Việt Nam Đồng)</option>
                    <option value="USD">USD (Đô la Mỹ - Expat)</option>
                  </select>
                </div>
              </div>

              {/* Basic Salary Section */}
              <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block font-bold text-slate-900 text-sm mb-1">
                      Basic Salary (Lương cơ bản) <span className="text-red-500">*</span>
                    </label>
                    <p className="text-[11px] text-slate-500">Mức lương làm căn cứ đóng bảo hiểm &amp; tính lương chính khóa</p>
                  </div>
                  <div className="w-48">
                    <input
                      type="number"
                      required
                      value={formData.basicSalary}
                      onChange={(e) => setFormData(prev => ({ ...prev, basicSalary: Number(e.target.value) }))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-base text-right text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* 12 Allowance & Subsidy Inputs Grid */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Các Khoản Phụ Cấp &amp; Trợ Cấp (Allowance &amp; Subsidy)</span>
                  <span className="text-emerald-700 font-mono font-bold normal-case text-xs">
                    Tổng phụ cấp: {liveTotalAllowance.toLocaleString('en-US')} {formData.currency}
                  </span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1 truncate" title="Position Allowance">
                      Phụ cấp chức vụ (Position)
                    </label>
                    <input
                      type="number"
                      value={formData.positionAllowance}
                      onChange={(e) => setFormData(prev => ({ ...prev, positionAllowance: Number(e.target.value) }))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1 truncate" title="Responsible Allowance">
                      Phụ cấp trách nhiệm (Responsible)
                    </label>
                    <input
                      type="number"
                      value={formData.responsibleAllowance}
                      onChange={(e) => setFormData(prev => ({ ...prev, responsibleAllowance: Number(e.target.value) }))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1 truncate" title="Petrol Subsidy">
                      Trợ cấp xăng xe (Petrol)
                    </label>
                    <input
                      type="number"
                      value={formData.petrolSubsidy}
                      onChange={(e) => setFormData(prev => ({ ...prev, petrolSubsidy: Number(e.target.value) }))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1 truncate" title="Phone Subsidy">
                      Trợ cấp điện thoại (Phone)
                    </label>
                    <input
                      type="number"
                      value={formData.phoneSubsidy}
                      onChange={(e) => setFormData(prev => ({ ...prev, phoneSubsidy: Number(e.target.value) }))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1 truncate" title="Language Subsidy">
                      Trợ cấp ngôn ngữ (Language)
                    </label>
                    <input
                      type="number"
                      value={formData.languageSubsidy}
                      onChange={(e) => setFormData(prev => ({ ...prev, languageSubsidy: Number(e.target.value) }))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1 truncate" title="Regulation compliance subsidy">
                      Trợ cấp nội quy (Regulation)
                    </label>
                    <input
                      type="number"
                      value={formData.regulationSubsidy}
                      onChange={(e) => setFormData(prev => ({ ...prev, regulationSubsidy: Number(e.target.value) }))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1 truncate" title="Uniform subsidy">
                      Hỗ trợ trang phục (Uniform)
                    </label>
                    <input
                      type="number"
                      value={formData.uniformSubsidy}
                      onChange={(e) => setFormData(prev => ({ ...prev, uniformSubsidy: Number(e.target.value) }))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1 truncate" title="Ability allowance">
                      Trợ cấp năng lực (Ability)
                    </label>
                    <input
                      type="number"
                      value={formData.abilityAllowance}
                      onChange={(e) => setFormData(prev => ({ ...prev, abilityAllowance: Number(e.target.value) }))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1 truncate" title="House Subsidy">
                      Trợ cấp nhà ở (House)
                    </label>
                    <input
                      type="number"
                      value={formData.houseSubsidy}
                      onChange={(e) => setFormData(prev => ({ ...prev, houseSubsidy: Number(e.target.value) }))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1 truncate" title="Transportation fee Subsidy">
                      Trợ cấp thăm thân (Transport)
                    </label>
                    <input
                      type="number"
                      value={formData.transportationSubsidy}
                      onChange={(e) => setFormData(prev => ({ ...prev, transportationSubsidy: Number(e.target.value) }))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1 truncate" title="Living expense Subsidy">
                      Trợ cấp xa nhà (Living expense)
                    </label>
                    <input
                      type="number"
                      value={formData.livingExpenseSubsidy}
                      onChange={(e) => setFormData(prev => ({ ...prev, livingExpenseSubsidy: Number(e.target.value) }))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1 truncate" title="Meal allowance">
                      Hỗ trợ tiền ăn (Meal)
                    </label>
                    <input
                      type="number"
                      value={formData.mealAllowance}
                      onChange={(e) => setFormData(prev => ({ ...prev, mealAllowance: Number(e.target.value) }))}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-right"
                    />
                  </div>
                </div>
              </div>

              {/* Total Salary Real-time Summary Card */}
              <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-xs block">Total Salary (Tổng lương thực nhận)</span>
                  <span className="text-[11px] text-slate-400">Lương cơ bản + 12 khoản phụ cấp</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-2xl text-emerald-400 tabular-nums">
                    {liveTotalSalary.toLocaleString('en-US')}
                  </span>
                  <span className="text-xs text-slate-300 ml-1.5 font-bold">{formData.currency}</span>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm cursor-pointer"
                >
                  {editingSalary ? 'Lưu Thay Đổi' : 'Xác Nhận Thiết Lập'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Individual Payslip Printable Modal */}
      {payslipSalary && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base uppercase">
                  PHIẾU LƯƠNG NHÂN VIÊN / SALARY PAYSLIP
                </h3>
                <p className="text-xs text-slate-500">{COMPANY_INFO.name}</p>
              </div>
              <button
                onClick={() => setPayslipSalary(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Payslip Employee info */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>Họ và tên: <strong className="text-slate-900">{payslipSalary.fullName}</strong></div>
              <div>Mã nhân viên: <strong className="font-mono text-slate-900">{payslipSalary.employeeId}</strong></div>
              <div>Bộ phận: <strong className="text-slate-900">{payslipSalary.department}</strong></div>
              <div>Vị trí: <strong className="text-slate-900">{payslipSalary.position}</strong></div>
            </div>

            {/* Breakdown Table */}
            <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2">Khoản Mục Chi Trả</th>
                    <th className="p-2 text-right">Số Tiền ({payslipSalary.currency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  <tr>
                    <td className="p-2 font-sans font-semibold">Lương cơ bản (Basic Salary)</td>
                    <td className="p-2 text-right font-bold text-slate-900">{payslipSalary.basicSalary.toLocaleString('en-US')}</td>
                  </tr>
                  {payslipSalary.positionAllowance > 0 && (
                    <tr>
                      <td className="p-2 font-sans">Phụ cấp chức vụ (Position)</td>
                      <td className="p-2 text-right">{payslipSalary.positionAllowance.toLocaleString('en-US')}</td>
                    </tr>
                  )}
                  {payslipSalary.responsibleAllowance > 0 && (
                    <tr>
                      <td className="p-2 font-sans">Phụ cấp trách nhiệm (Responsible)</td>
                      <td className="p-2 text-right">{payslipSalary.responsibleAllowance.toLocaleString('en-US')}</td>
                    </tr>
                  )}
                  {payslipSalary.petrolSubsidy > 0 && (
                    <tr>
                      <td className="p-2 font-sans">Trợ cấp xăng xe (Petrol)</td>
                      <td className="p-2 text-right">{payslipSalary.petrolSubsidy.toLocaleString('en-US')}</td>
                    </tr>
                  )}
                  {payslipSalary.phoneSubsidy > 0 && (
                    <tr>
                      <td className="p-2 font-sans">Trợ cấp điện thoại (Phone)</td>
                      <td className="p-2 text-right">{payslipSalary.phoneSubsidy.toLocaleString('en-US')}</td>
                    </tr>
                  )}
                  {payslipSalary.languageSubsidy > 0 && (
                    <tr>
                      <td className="p-2 font-sans">Trợ cấp ngôn ngữ (Language)</td>
                      <td className="p-2 text-right">{payslipSalary.languageSubsidy.toLocaleString('en-US')}</td>
                    </tr>
                  )}
                  {payslipSalary.regulationSubsidy > 0 && (
                    <tr>
                      <td className="p-2 font-sans">Trợ cấp nội quy (Regulation)</td>
                      <td className="p-2 text-right">{payslipSalary.regulationSubsidy.toLocaleString('en-US')}</td>
                    </tr>
                  )}
                  {payslipSalary.uniformSubsidy > 0 && (
                    <tr>
                      <td className="p-2 font-sans">Hỗ trợ trang phục (Uniform)</td>
                      <td className="p-2 text-right">{payslipSalary.uniformSubsidy.toLocaleString('en-US')}</td>
                    </tr>
                  )}
                  {payslipSalary.abilityAllowance > 0 && (
                    <tr>
                      <td className="p-2 font-sans">Trợ cấp năng lực (Ability)</td>
                      <td className="p-2 text-right">{payslipSalary.abilityAllowance.toLocaleString('en-US')}</td>
                    </tr>
                  )}
                  {payslipSalary.houseSubsidy > 0 && (
                    <tr>
                      <td className="p-2 font-sans">Trợ cấp nhà ở (House)</td>
                      <td className="p-2 text-right">{payslipSalary.houseSubsidy.toLocaleString('en-US')}</td>
                    </tr>
                  )}
                  {payslipSalary.transportationSubsidy > 0 && (
                    <tr>
                      <td className="p-2 font-sans">Trợ cấp thăm thân (Transportation fee)</td>
                      <td className="p-2 text-right">{payslipSalary.transportationSubsidy.toLocaleString('en-US')}</td>
                    </tr>
                  )}
                  {payslipSalary.livingExpenseSubsidy > 0 && (
                    <tr>
                      <td className="p-2 font-sans">Trợ cấp xa nhà (Living expense)</td>
                      <td className="p-2 text-right">{payslipSalary.livingExpenseSubsidy.toLocaleString('en-US')}</td>
                    </tr>
                  )}
                  {payslipSalary.mealAllowance > 0 && (
                    <tr>
                      <td className="p-2 font-sans">Hỗ trợ tiền ăn (Meal)</td>
                      <td className="p-2 text-right">{payslipSalary.mealAllowance.toLocaleString('en-US')}</td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-slate-900 text-white font-bold font-mono">
                  <tr>
                    <td className="p-2 font-sans">TỔNG LƯƠNG THỰC LĨNH (TOTAL SALARY)</td>
                    <td className="p-2 text-right text-emerald-400 text-sm">
                      {payslipSalary.totalSalary.toLocaleString('en-US')} {payslipSalary.currency}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In Phiếu Lương</span>
              </button>
              <button
                onClick={() => setPayslipSalary(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg text-xs hover:bg-slate-200 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
