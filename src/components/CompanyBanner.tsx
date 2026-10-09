import React from 'react';
import { Building2, MapPin, Download, Upload, Printer, RefreshCw, Eye } from 'lucide-react';
import { COMPANY_INFO } from '../data/initialEmployees';

interface CompanyBannerProps {
  onExportExcel: () => void;
  onImportClick: () => void;
  onPrint: () => void;
  onResetData: () => void;
  totalCount: number;
  activeCount: number;
  expiredCount: number;
  themeStyle: 'excel' | 'modern';
  setThemeStyle: (style: 'excel' | 'modern') => void;
  canExportImport?: boolean;
}

export const CompanyBanner: React.FC<CompanyBannerProps> = ({
  onExportExcel,
  onImportClick,
  onPrint,
  onResetData,
  totalCount,
  activeCount,
  expiredCount,
  themeStyle,
  setThemeStyle,
  canExportImport = true
}) => {
  return (
    <div className="bg-white border-b border-slate-200">
      {/* Top Company Info Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs sm:text-sm text-slate-700">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="font-semibold text-slate-900">Tên cơ quan đơn vị:</span>
              <span className="font-bold text-slate-900">{COMPANY_INFO.name}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="font-medium">Địa chỉ:</span>
              <span>{COMPANY_INFO.address}</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center flex-wrap gap-2">
            {/* View style toggle */}
            <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-xs">
              <button
                onClick={() => setThemeStyle('excel')}
                className={`px-2.5 py-1 font-medium rounded-md transition-colors ${
                  themeStyle === 'excel'
                    ? 'bg-amber-100 text-amber-900 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Giao diện bảng màu vàng chuẩn mẫu Excel"
              >
                Mẫu Excel Gốc
              </button>
              <button
                onClick={() => setThemeStyle('modern')}
                className={`px-2.5 py-1 font-medium rounded-md transition-colors ${
                  themeStyle === 'modern'
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Giao diện hiện đại công sở"
              >
                Giao Diện Hiện Đại
              </button>
            </div>

            {canExportImport && (
              <>
                <button
                  onClick={onExportExcel}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Xuất Excel (.xlsx)
                </button>

                <button
                  onClick={onImportClick}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Nhập Excel
                </button>
              </>
            )}

            <button
              onClick={onPrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5" />
              In Sổ
            </button>

            <button
              onClick={onResetData}
              title="Đặt lại dữ liệu mẫu gốc"
              className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Title Ribbon (Matching the orange/peach ribbon in the image) */}
      <div className="bg-[#fad3b2] py-2.5 px-4 text-center border-y border-[#e8bb95]">
        <h1 className="text-base sm:text-lg md:text-xl font-bold tracking-wide text-slate-900 uppercase">
          SỔ QUẢN LÝ LAO ĐỘNG/ LABOR MANAGEMENT BOOK
        </h1>
        <p className="text-xs text-slate-700 font-medium mt-0.5">
          Quy chuẩn theo Bộ Luật Lao Động 2019 &amp; Nghị định số 145/2020/NĐ-CP của Chính phủ
        </p>
      </div>

      {/* Metric strip below title */}
      <div className="bg-slate-50 border-b border-slate-200 py-2 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-slate-600 overflow-x-auto gap-4">
          <div className="flex items-center gap-4 shrink-0 font-medium">
            <span>Tổng nhân sự: <strong className="font-semibold text-slate-900 font-mono tabular-nums">{totalCount}</strong></span>
            <span aria-hidden="true" className="text-slate-300">|</span>
            <span>Đang làm việc: <strong className="font-semibold text-emerald-700 font-mono tabular-nums">{activeCount}</strong></span>
            <span aria-hidden="true" className="text-slate-300">|</span>
            <span>Đã quá hạn HĐ: <strong className="font-semibold text-red-600 font-mono tabular-nums">{expiredCount}</strong></span>
          </div>
          <div className="text-slate-500 shrink-0 font-mono text-[11px]">
            Ngày tham chiếu chuẩn: 10/09/2026
          </div>
        </div>
      </div>
    </div>
  );
};
