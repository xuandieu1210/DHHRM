import React from 'react';
import { Users, UserCheck, UserX, AlertTriangle, Building, Award, Globe, Briefcase } from 'lucide-react';
import { Employee } from '../types/employee';
import { getContractExpiryStatus } from '../utils/dateUtils';

interface DashboardAnalyticsProps {
  employees: Employee[];
  onFilterDepartment: (dept: string) => void;
  onFilterStatus: (status: string) => void;
}

export const DashboardAnalytics: React.FC<DashboardAnalyticsProps> = ({
  employees,
  onFilterDepartment,
  onFilterStatus
}) => {
  // Aggregate Metrics
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => !e.resignationDate);
  const resignedEmployees = employees.filter(e => !!e.resignationDate);

  let expiredContractsCount = 0;
  let warningContractsCount = 0;

  employees.forEach(emp => {
    const status = getContractExpiryStatus(emp);
    if (status.status === 'expired') expiredContractsCount++;
    if (status.status === 'warning') warningContractsCount++;
  });

  // Department distribution
  const deptCounts: Record<string, number> = {};
  employees.forEach(e => {
    deptCounts[e.department] = (deptCounts[e.department] || 0) + 1;
  });

  // Nationality distribution
  const natCounts: Record<string, number> = {};
  employees.forEach(e => {
    natCounts[e.nationality] = (natCounts[e.nationality] || 0) + 1;
  });

  // Gender distribution
  const maleCount = employees.filter(e => e.gender === 'Male').length;
  const femaleCount = employees.filter(e => e.gender === 'Female').length;

  // Education degree distribution
  const degreeCounts: Record<string, number> = {};
  employees.forEach(e => {
    const deg = e.educationDegree || 'Khác';
    degreeCounts[deg] = (degreeCounts[deg] || 0) + 1;
  });

  // Contract Type distribution
  const contractCounts: Record<string, number> = {};
  employees.forEach(e => {
    const cType = e.contractType || 'Khác';
    contractCounts[cType] = (contractCounts[cType] || 0) + 1;
  });

  // Average time of service
  const totalMonths = employees.reduce((acc, curr) => acc + (Number(curr.timeOfService) || 0), 0);
  const avgMonths = totalEmployees > 0 ? (totalMonths / totalEmployees).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      {/* KPI Stat Cards (Single-Elevation, anti-slop, clean typography with tabular numerals) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Total */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Tổng nhân sự</span>
            <Users className="w-4 h-4 text-slate-600" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900">
            {totalEmployees}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Trong sổ quản lý lao động
          </div>
        </div>

        {/* Card 2: Active */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-medium">
            <span>Đang làm việc</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold font-mono tabular-nums text-emerald-700">
            {activeEmployees.length}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {totalEmployees > 0 ? ((activeEmployees.length / totalEmployees) * 100).toFixed(0) : 0}% quy mô nhân sự
          </div>
        </div>

        {/* Card 3: Warning */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-amber-700 text-xs font-medium">
            <span>HĐ sắp hết hạn (≤60 ngày)</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold font-mono tabular-nums text-amber-600">
            {warningContractsCount}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Cần lên kế hoạch gia hạn
          </div>
        </div>

        {/* Card 4: Expired */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-rose-700 text-xs font-medium">
            <span>HĐ đã quá hạn</span>
            <UserX className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold font-mono tabular-nums text-rose-600">
            {expiredContractsCount}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Cần ký phụ lục hoặc tái ký
          </div>
        </div>
      </div>

      {/* Structured Analytics Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Department Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-slate-500" />
              Cơ cấu nhân sự theo Bộ phận
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              {Object.keys(deptCounts).length} bộ phận
            </span>
          </div>

          <div className="space-y-3">
            {Object.entries(deptCounts).map(([dept, count]) => {
              const percentage = totalEmployees > 0 ? (count / totalEmployees) * 100 : 0;
              return (
                <div key={dept} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-700">{dept}</span>
                    <span className="text-slate-900 font-mono tabular-nums font-semibold">
                      {count} người ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-800 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Contract Types Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-slate-500" />
              Cơ cấu Loại Hợp Đồng Lao Động
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              Thâm niên TB: {avgMonths} tháng
            </span>
          </div>

          <div className="space-y-3">
            {Object.entries(contractCounts).map(([cType, count]) => {
              const percentage = totalEmployees > 0 ? (count / totalEmployees) * 100 : 0;
              return (
                <div key={cType} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-700">{cType}</span>
                    <span className="text-slate-900 font-mono tabular-nums font-semibold">
                      {count} ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Nationality and Demographics */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-slate-500" />
              Quốc tịch &amp; Giới tính
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            {/* Gender bar */}
            <div>
              <div className="flex justify-between mb-1.5 font-medium text-slate-700">
                <span>Nam: <strong className="font-mono tabular-nums">{maleCount}</strong></span>
                <span>Nữ: <strong className="font-mono tabular-nums">{femaleCount}</strong></span>
              </div>
              <div className="flex h-3 rounded-full overflow-hidden bg-slate-100">
                <div
                  className="bg-indigo-600 h-full"
                  style={{ width: `${totalEmployees > 0 ? (maleCount / totalEmployees) * 100 : 0}%` }}
                  title={`Nam: ${maleCount}`}
                />
                <div
                  className="bg-rose-500 h-full"
                  style={{ width: `${totalEmployees > 0 ? (femaleCount / totalEmployees) * 100 : 0}%` }}
                  title={`Nữ: ${femaleCount}`}
                />
              </div>
            </div>

            {/* Nationalities */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <span className="font-semibold text-slate-700 block">Phân bố Quốc tịch:</span>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(natCounts).map(([nat, count]) => (
                  <div key={nat} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-slate-500 text-[11px]">{nat}</div>
                    <div className="text-base font-bold font-mono text-slate-900 tabular-nums">
                      {count} <span className="text-xs font-normal text-slate-500">người</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Education & Qualifications */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-slate-500" />
              Trình độ học vấn &amp; Đào tạo
            </h3>
          </div>

          <div className="space-y-3">
            {Object.entries(degreeCounts).map(([deg, count]) => {
              const percentage = totalEmployees > 0 ? (count / totalEmployees) * 100 : 0;
              return (
                <div key={deg} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-700">{deg}</span>
                    <span className="text-slate-900 font-mono tabular-nums font-semibold">
                      {count} ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-600 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
