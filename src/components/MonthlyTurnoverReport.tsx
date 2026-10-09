import React, { useState, useMemo } from 'react';
import { Calendar, Users, UserPlus, UserMinus, TrendingUp, AlertCircle, Eye, ArrowUpRight, ArrowDownRight, X } from 'lucide-react';
import { Employee } from '../types/employee';
import { getMonthlyWorkforceStats, getAvailableYears } from '../utils/monthlyStats';
import { MonthlyStatsRecord } from '../types/recruitment';
import { formatDateDisplay } from '../utils/dateUtils';

interface MonthlyTurnoverReportProps {
  employees: Employee[];
  onViewEmployeeById?: (employeeId: string) => void;
}

export const MonthlyTurnoverReport: React.FC<MonthlyTurnoverReportProps> = ({
  employees,
  onViewEmployeeById
}) => {
  const availableYears = useMemo(() => getAvailableYears(employees), [employees]);
  const [selectedYear, setSelectedYear] = useState<number>(availableYears[0] || 2026);
  const [selectedMonthDetail, setSelectedMonthDetail] = useState<MonthlyStatsRecord | null>(null);

  const monthlyRecords = useMemo(() => {
    return getMonthlyWorkforceStats(employees, selectedYear);
  }, [employees, selectedYear]);

  // Aggregate year totals
  const totalJoinersInYear = monthlyRecords.reduce((sum, r) => sum + r.newJoinersCount, 0);
  const totalResignedInYear = monthlyRecords.reduce((sum, r) => sum + r.resignedCount, 0);
  const latestMonthActive = monthlyRecords[monthlyRecords.length - 1]?.activeCount || 0;
  const netGrowth = totalJoinersInYear - totalResignedInYear;
  const avgTurnoverRate = (
    monthlyRecords.reduce((sum, r) => sum + r.turnoverRate, 0) / 12
  ).toFixed(1);

  // Find max active count for chart scaling
  const maxActiveCount = Math.max(...monthlyRecords.map(r => r.activeCount), 10);
  const maxFluctuation = Math.max(...monthlyRecords.map(r => Math.max(r.newJoinersCount, r.resignedCount)), 5);

  return (
    <div className="space-y-6">
      {/* Top Controls & Year Selector */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            Thống Kê Nhân Sự &amp; Biến Động Lao Động Theo Tháng
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi số lượng nhân sự hiện diện, nhân sự tuyển mới và nhân sự thôi việc từng tháng của DH Textile.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">Năm thống kê:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-slate-900 focus:outline-none"
          >
            {availableYears.map(yr => (
              <option key={yr} value={yr}>Năm {yr}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Year Summary KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* KPI 1: Active At Year End */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Quy mô nhân sự (Cuối năm)</span>
            <Users className="w-4 h-4 text-slate-600" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900">
            {latestMonthActive}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Nhân sự đang làm việc tại DH Textile
          </div>
        </div>

        {/* KPI 2: Total New Joiners */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-medium">
            <span>Tuyển mới cả năm</span>
            <UserPlus className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold font-mono tabular-nums text-emerald-700">
            +{totalJoinersInYear}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Lao động mới tiếp nhận trong năm {selectedYear}
          </div>
        </div>

        {/* KPI 3: Total Resignations */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-rose-700 text-xs font-medium">
            <span>Thôi việc cả năm</span>
            <UserMinus className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold font-mono tabular-nums text-rose-600">
            -{totalResignedInYear}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Số lao động chấm dứt HĐLĐ trong năm {selectedYear}
          </div>
        </div>

        {/* KPI 4: Net Growth & Turnover */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-indigo-700 text-xs font-medium">
            <span>Tăng trưởng ròng &amp; Tỷ lệ nghỉ</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold font-mono tabular-nums text-indigo-900 flex items-baseline gap-2">
            <span>{netGrowth >= 0 ? `+${netGrowth}` : netGrowth}</span>
            <span className="text-xs font-normal text-slate-500">({avgTurnoverRate}%/tháng)</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Tỷ lệ luân chuyển lao động bình quân
          </div>
        </div>
      </div>

      {/* Visual Monthly Trend Chart */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Biểu Đồ Diễn Biến Nhân Sự Từng Tháng (Năm {selectedYear})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cột xanh: Tuyển mới | Cột đỏ: Nghỉ việc | Đường xanh đậm: Tổng quy mô nhân sự
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-600 font-medium">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span> Tuyển mới
            </span>
            <span className="flex items-center gap-1.5 text-slate-600 font-medium">
              <span className="w-2.5 h-2.5 rounded bg-rose-500"></span> Nghỉ việc
            </span>
            <span className="flex items-center gap-1.5 text-slate-600 font-medium">
              <span className="w-2.5 h-2.5 rounded bg-slate-900"></span> Nhân sự cuối tháng
            </span>
          </div>
        </div>

        {/* 12 Months Visual Grid */}
        <div className="grid grid-cols-12 gap-1.5 sm:gap-2 pt-4 pb-2 items-end min-h-[180px]">
          {monthlyRecords.map((record) => {
            const heightPercent = Math.max(15, (record.activeCount / maxActiveCount) * 100);

            return (
              <div
                key={record.month}
                onClick={() => setSelectedMonthDetail(record)}
                className="flex flex-col items-center justify-end h-full group cursor-pointer"
              >
                {/* Active headcount indicator */}
                <span className="text-[10px] font-mono font-bold text-slate-700 opacity-90 group-hover:text-indigo-600 mb-1 tabular-nums">
                  {record.activeCount}
                </span>

                {/* Bars column */}
                <div className="w-full flex items-end justify-center gap-1 h-32 bg-slate-50 rounded-t-lg p-1 group-hover:bg-slate-100 transition-colors">
                  {/* Joiners bar */}
                  <div
                    className="w-1/2 bg-emerald-500 rounded-t-sm transition-all"
                    style={{
                      height: `${record.newJoinersCount > 0 ? Math.max(12, (record.newJoinersCount / maxFluctuation) * 100) : 0}%`,
                      opacity: record.newJoinersCount > 0 ? 1 : 0
                    }}
                    title={`Tháng ${record.month}: Tuyển mới +${record.newJoinersCount}`}
                  />
                  {/* Resigned bar */}
                  <div
                    className="w-1/2 bg-rose-500 rounded-t-sm transition-all"
                    style={{
                      height: `${record.resignedCount > 0 ? Math.max(12, (record.resignedCount / maxFluctuation) * 100) : 0}%`,
                      opacity: record.resignedCount > 0 ? 1 : 0
                    }}
                    title={`Tháng ${record.month}: Nghỉ việc -${record.resignedCount}`}
                  />
                </div>

                {/* Month label button */}
                <div className="mt-2 text-center">
                  <span className="text-[11px] font-semibold text-slate-700 group-hover:text-indigo-600 block">
                    T{record.month}
                  </span>
                  {(record.newJoinersCount > 0 || record.resignedCount > 0) ? (
                    <span className="text-[9px] font-mono text-slate-500 block">
                      +{record.newJoinersCount}/-{record.resignedCount}
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono text-slate-300 block">-</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full 12-Month Detailed Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-tight">
            Bảng Thống Kê Chi Tiết Nhân Sự &amp; Biến Động Lao Động 12 Tháng Năm {selectedYear}
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Nhấp vào hàng để xem danh sách lao động biến động
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 text-center">Tháng</th>
                <th className="py-2.5 px-3 text-right">Nhân sự cuối tháng</th>
                <th className="py-2.5 px-3 text-right text-emerald-700">Tuyển mới vào làm (+)</th>
                <th className="py-2.5 px-3 text-right text-rose-700">Nghỉ việc thôi việc (-)</th>
                <th className="py-2.5 px-3 text-right">Biến động ròng</th>
                <th className="py-2.5 px-3 text-right">Tỷ lệ thôi việc</th>
                <th className="py-2.5 px-3 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {monthlyRecords.map((rec) => {
                const net = rec.newJoinersCount - rec.resignedCount;
                return (
                  <tr
                    key={rec.month}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedMonthDetail(rec)}
                  >
                    <td className="py-2.5 px-3 text-center font-bold text-slate-900">
                      Tháng {rec.month}/{selectedYear}
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {rec.activeCount} <span className="font-normal text-slate-500 text-[11px]">người</span>
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-700 tabular-nums">
                      {rec.newJoinersCount > 0 ? `+${rec.newJoinersCount}` : '0'}
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-rose-700 tabular-nums">
                      {rec.resignedCount > 0 ? `-${rec.resignedCount}` : '0'}
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums">
                      {net > 0 ? (
                        <span className="text-emerald-600 inline-flex items-center gap-0.5">
                          <ArrowUpRight className="w-3 h-3" />+{net}
                        </span>
                      ) : net < 0 ? (
                        <span className="text-rose-600 inline-flex items-center gap-0.5">
                          <ArrowDownRight className="w-3 h-3" />{net}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-700 tabular-nums">
                      {rec.turnoverRate > 0 ? `${rec.turnoverRate}%` : '0%'}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMonthDetail(rec);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Year Total Row */}
            <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300">
              <tr>
                <td className="py-3 px-3 text-center uppercase text-slate-900">
                  CẢ NĂM {selectedYear}
                </td>
                <td className="py-3 px-3 text-right font-mono text-slate-900">
                  TB: {(monthlyRecords.reduce((s, r) => s + r.activeCount, 0) / 12).toFixed(0)} người
                </td>
                <td className="py-3 px-3 text-right font-mono text-emerald-700">
                  +{totalJoinersInYear} người
                </td>
                <td className="py-3 px-3 text-right font-mono text-rose-700">
                  -{totalResignedInYear} người
                </td>
                <td className="py-3 px-3 text-right font-mono text-slate-900">
                  {netGrowth >= 0 ? `+${netGrowth}` : netGrowth} người
                </td>
                <td className="py-3 px-3 text-right font-mono text-slate-900">
                  TB: {avgTurnoverRate}%
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Month Drill-down Modal */}
      {selectedMonthDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  Chi Tiết Biến Động Nhân Sự Tháng {selectedMonthDetail.month}/{selectedMonthDetail.year}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Quy mô cuối tháng: <strong>{selectedMonthDetail.activeCount} lao động</strong> | Tuyển mới: <strong className="text-emerald-700">+{selectedMonthDetail.newJoinersCount}</strong> | Nghỉ việc: <strong className="text-rose-700">-{selectedMonthDetail.resignedCount}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedMonthDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {/* 1. Joiners Section */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5 text-emerald-700">
                  <UserPlus className="w-4 h-4" />
                  Nhân Sự Mới Tiếp Nhận Trong Tháng ({selectedMonthDetail.joiners.length} người)
                </h4>

                {selectedMonthDetail.joiners.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-lg text-slate-500 text-center">
                    Không có nhân sự mới gia nhập trong tháng này.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 text-slate-700 font-semibold text-[11px]">
                        <tr>
                          <th className="p-2">Mã NV</th>
                          <th className="p-2">Họ và Tên</th>
                          <th className="p-2">Vị trí</th>
                          <th className="p-2">Bộ phận</th>
                          <th className="p-2 text-right">Ngày vào làm</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedMonthDetail.joiners.map((emp) => (
                          <tr key={emp.id} className="hover:bg-slate-50">
                            <td className="p-2 font-mono font-bold text-slate-800">{emp.employeeId}</td>
                            <td className="p-2 font-bold text-slate-900">{emp.fullName}</td>
                            <td className="p-2 text-slate-700">{emp.position}</td>
                            <td className="p-2 text-slate-700">{emp.department}</td>
                            <td className="p-2 text-right font-mono text-slate-800">{formatDateDisplay(emp.joiningDate)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* 2. Resignees Section */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5 text-rose-700">
                  <UserMinus className="w-4 h-4" />
                  Nhân Sự Thôi Việc / Nghỉ Việc Trong Tháng ({selectedMonthDetail.resignees.length} người)
                </h4>

                {selectedMonthDetail.resignees.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-lg text-slate-500 text-center">
                    Không có nhân sự thôi việc trong tháng này (Tỷ lệ giữ chân 100%).
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 text-slate-700 font-semibold text-[11px]">
                        <tr>
                          <th className="p-2">Mã NV</th>
                          <th className="p-2">Họ và Tên</th>
                          <th className="p-2">Bộ phận</th>
                          <th className="p-2">Ngày nghỉ việc</th>
                          <th className="p-2">Lý do nghỉ việc</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedMonthDetail.resignees.map((emp) => (
                          <tr key={emp.id} className="hover:bg-slate-50">
                            <td className="p-2 font-mono font-bold text-slate-800">{emp.employeeId}</td>
                            <td className="p-2 font-bold text-slate-900">{emp.fullName}</td>
                            <td className="p-2 text-slate-700">{emp.department}</td>
                            <td className="p-2 font-mono text-slate-800">{formatDateDisplay(emp.resignationDate)}</td>
                            <td className="p-2 text-rose-700 font-medium">{emp.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedMonthDetail(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
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
