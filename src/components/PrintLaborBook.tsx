import React from 'react';
import { Employee } from '../types/employee';
import { COMPANY_INFO } from '../data/initialEmployees';
import { formatDateDisplay } from '../utils/dateUtils';
import { X, Printer } from 'lucide-react';

interface PrintLaborBookProps {
  employees: Employee[];
  onClose: () => void;
}

export const PrintLaborBook: React.FC<PrintLaborBookProps> = ({ employees, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      {/* Top action bar (hidden during print) */}
      <div className="sticky top-0 bg-slate-900 text-white p-3 flex items-center justify-between print:hidden z-50 shadow-md">
        <div className="flex items-center gap-3">
          <span className="font-bold text-sm">Xem trước khi In Sổ Quản Lý Lao Động (Khổ ngang A4)</span>
          <span className="text-xs text-slate-300">Tổng cộng {employees.length} lao động</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Thực Hiện In / Lưu PDF</span>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Printable Sheet */}
      <div className="p-8 max-w-[1400px] mx-auto text-slate-900 font-sans print:p-2">
        {/* Header Block */}
        <div className="mb-6 space-y-1">
          <div className="text-xs">
            <strong>Tên cơ quan đơn vị:</strong> {COMPANY_INFO.name}
          </div>
          <div className="text-xs">
            <strong>Địa chỉ:</strong> {COMPANY_INFO.address}
          </div>
        </div>

        {/* Title */}
        <div className="text-center my-6">
          <h1 className="text-xl font-bold uppercase tracking-wider">
            SỔ QUẢN LÝ LAO ĐỘNG / LABOR MANAGEMENT BOOK
          </h1>
          <p className="text-xs italic text-slate-600 mt-1">
            (Lập và lưu giữ theo quy định tại Điều 12 Bộ luật Lao động 2019)
          </p>
        </div>

        {/* Official Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-[10px] border-collapse border border-black">
            <thead>
              <tr className="bg-[#fad3b2] text-center font-bold">
                <th className="border border-black p-1">STT<br/><span className="font-normal italic">No.</span></th>
                <th className="border border-black p-1">HỌ VÀ TÊN<br/><span className="font-normal italic">Full Name</span></th>
                <th className="border border-black p-1">GIỚI TÍNH<br/><span className="font-normal italic">Gender</span></th>
                <th className="border border-black p-1">MÃ SỐ NV<br/><span className="font-normal italic">Emp. ID</span></th>
                <th className="border border-black p-1">NGÀY SINH<br/><span className="font-normal italic">DOB</span></th>
                <th className="border border-black p-1">QUỐC TỊCH<br/><span className="font-normal italic">Nationality</span></th>
                <th className="border border-black p-1">QUÊ QUÁN<br/><span className="font-normal italic">Native place</span></th>
                <th className="border border-black p-1">CMND/CCCD<br/><span className="font-normal italic">ID Card</span></th>
                <th className="border border-black p-1">TRÌNH ĐỘ<br/><span className="font-normal italic">Degree</span></th>
                <th className="border border-black p-1">CHUYÊN MÔN<br/><span className="font-normal italic">Profession</span></th>
                <th className="border border-black p-1">CẤP BẬC<br/><span className="font-normal italic">Level</span></th>
                <th className="border border-black p-1">VỊ TRÍ LÀM VIỆC<br/><span className="font-normal italic">Position</span></th>
                <th className="border border-black p-1">BỘ PHẬN<br/><span className="font-normal italic">Dept</span></th>
                <th className="border border-black p-1">LOẠI HĐLĐ<br/><span className="font-normal italic">Contract</span></th>
                <th className="border border-black p-1">NGÀY BẮT ĐẦU<br/><span className="font-normal italic">Joining</span></th>
                <th className="border border-black p-1">THỜI GIAN LV<br/><span className="font-normal italic">Service (m)</span></th>
                <th className="border border-black p-1">NGÀY NGHỈ<br/><span className="font-normal italic">Resign</span></th>
                <th className="border border-black p-1">GHI CHÚ<br/><span className="font-normal italic">Remark</span></th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp, idx) => (
                <tr key={emp.id} className="text-left">
                  <td className="border border-black p-1 text-center font-mono">{idx + 1}</td>
                  <td className="border border-black p-1 font-semibold">{emp.fullName}</td>
                  <td className="border border-black p-1 text-center">{emp.gender === 'Male' ? 'Nam' : 'Nữ'}</td>
                  <td className="border border-black p-1 text-center font-mono">{emp.employeeId}</td>
                  <td className="border border-black p-1 text-center font-mono">{formatDateDisplay(emp.dateOfBirth)}</td>
                  <td className="border border-black p-1">{emp.nationality}</td>
                  <td className="border border-black p-1">{emp.nativePlace}</td>
                  <td className="border border-black p-1 font-mono text-center">{emp.idCardNumber}</td>
                  <td className="border border-black p-1">{emp.educationDegree}</td>
                  <td className="border border-black p-1">{emp.technicalProfession}</td>
                  <td className="border border-black p-1">{emp.rankLevel}</td>
                  <td className="border border-black p-1">{emp.position}</td>
                  <td className="border border-black p-1 font-semibold">{emp.department}</td>
                  <td className="border border-black p-1">{emp.contractType}</td>
                  <td className="border border-black p-1 font-mono text-center">{formatDateDisplay(emp.joiningDate)}</td>
                  <td className="border border-black p-1 font-mono text-center font-bold">{emp.timeOfService}</td>
                  <td className="border border-black p-1 font-mono text-center">{formatDateDisplay(emp.resignationDate)}</td>
                  <td className="border border-black p-1 text-[9px]">{emp.remark}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Signatures */}
        <div className="mt-12 flex justify-between text-xs text-center px-12">
          <div>
            <p className="font-bold uppercase">NGƯỜI LẬP SỔ</p>
            <p className="italic text-slate-500">(Ký và ghi rõ họ tên)</p>
            <div className="h-20"></div>
          </div>

          <div>
            <p className="font-bold uppercase">TRƯỞNG PHÒNG NHÂN SỰ</p>
            <p className="italic text-slate-500">(Ký và ghi rõ họ tên)</p>
            <div className="h-20"></div>
          </div>

          <div>
            <p className="italic text-slate-600 mb-1">Quảng Nam, ngày 09 tháng 10 năm 2026</p>
            <p className="font-bold uppercase">TỔNG GIÁM ĐỐC / NGƯỜI ĐẠI DIỆN PHÁP LUẬT</p>
            <p className="italic text-slate-500">(Ký, đóng dấu và ghi rõ họ tên)</p>
            <div className="h-20"></div>
            <p className="font-bold">DEOKYUN HAN</p>
          </div>
        </div>
      </div>
    </div>
  );
};
