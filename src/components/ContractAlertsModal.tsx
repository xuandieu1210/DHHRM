import React from 'react';
import { AlertTriangle, Clock, Calendar, CheckCircle2, RefreshCw } from 'lucide-react';
import { Employee } from '../types/employee';
import { getContractExpiryStatus, formatDateDisplay, getActiveContractEndDate } from '../utils/dateUtils';

interface ContractAlertsViewProps {
  employees: Employee[];
  onRenewContract: (emp: Employee) => void;
  onViewEmployee: (emp: Employee) => void;
}

export const ContractAlertsView: React.FC<ContractAlertsViewProps> = ({
  employees,
  onRenewContract,
  onViewEmployee
}) => {
  const alertList = employees
    .map(emp => {
      const expStatus = getContractExpiryStatus(emp);
      return {
        emp,
        expStatus,
        activeEndDate: getActiveContractEndDate(emp)
      };
    })
    .filter(item => item.expStatus.status === 'expired' || item.expStatus.status === 'warning')
    .sort((a, b) => {
      // Prioritize expired first, then smallest daysRemaining
      if (a.expStatus.status === 'expired' && b.expStatus.status !== 'expired') return -1;
      if (b.expStatus.status === 'expired' && a.expStatus.status !== 'expired') return 1;
      return (a.expStatus.daysRemaining || 0) - (b.expStatus.daysRemaining || 0);
    });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
      <div className="flex items-start justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Quản Lý Cảnh Báo Hết Hạn Hợp Đồng Lao Động
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Theo Điều 20 Bộ Luật Lao Động 2019, người sử dụng lao động phải ký hợp đồng lao động mới hoặc gia hạn trước khi hợp đồng hiện tại hết hạn.
          </p>
        </div>
        <span className="text-xs font-mono font-bold px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg">
          {alertList.length} trường hợp cần xử lý
        </span>
      </div>

      {alertList.length === 0 ? (
        <div className="py-12 text-center text-slate-500">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">Tất cả hợp đồng lao động đều an toàn</h3>
          <p className="text-xs text-slate-500 mt-1">
            Không có hợp đồng nào quá hạn hoặc sắp hết hạn trong vòng 60 ngày tới.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {alertList.map(({ emp, expStatus, activeEndDate }) => {
            const isExpired = expStatus.status === 'expired';

            return (
              <div key={emp.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-sm text-slate-900">{emp.fullName}</span>
                    <span className="text-xs font-mono font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {emp.employeeId}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                      isExpired ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {expStatus.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                    <span>Bộ phận: <strong className="text-slate-700">{emp.department}</strong></span>
                    <span>Vị trí: <strong className="text-slate-700">{emp.position}</strong></span>
                    <span>Loại HĐ hiện tại: <strong className="text-slate-700">{emp.contractType}</strong></span>
                    <span>Ngày hết hạn: <strong className="font-mono text-slate-900">{formatDateDisplay(activeEndDate || '')}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onViewEmployee(emp)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    Xem Hồ Sơ
                  </button>

                  <button
                    onClick={() => onRenewContract(emp)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Tái Ký / Gia Hạn</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
