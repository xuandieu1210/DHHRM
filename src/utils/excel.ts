import * as XLSX from 'xlsx';
import { Employee } from '../types/employee';
import { COMPANY_INFO } from '../data/initialEmployees';
import { formatDateDisplay } from './dateUtils';

export function exportLaborBookToExcel(employees: Employee[], fileName: string = 'So_Quan_Ly_Lao_Dong_DH_Textile.xlsx') {
  // Construct rows with headers
  const headerData = [
    [`Tên cơ quan đơn vị: ${COMPANY_INFO.name}`],
    [`Địa chỉ: ${COMPANY_INFO.address}`],
    [],
    [`${COMPANY_INFO.title}`],
    [],
    // Bilingual Table Headers (Row 6 & 7)
    [
      'STT / No.',
      'HỌ VÀ TÊN / Full Name',
      'GIỚI TÍNH / Gender',
      'MÃ SỐ NHÂN VIÊN / Emp. ID',
      'NGÀY SINH / DOB',
      'QUỐC TỊCH / Nationality',
      'Dân tộc / Ethnicity',
      'QUÊ QUÁN / Native place',
      'HỘ KHẨU THƯỜNG TRÚ / Permanent Address',
      'SỐ ĐIỆN THOẠI / Phone number',
      'CMND/CCCD / ID Card',
      'Số CMND cũ / Old ID',
      'NGÀY CẤP / Issue date of ID card',
      'NƠI CẤP / Place of issue',
      'TRÌNH ĐỘ / Degree',
      'CHUYÊN MÔN KỸ THUẬT / Profession',
      'CẤP BẬC / Level',
      'KHU VỰC LÀM VIỆC / Working Area',
      'VỊ TRÍ LÀM VIỆC / Position',
      'BỘ PHẬN / Department',
      'LOẠI HĐLĐ / Contract type',
      'HỢP ĐỒNG LAO ĐỘNG LẦN 1 / Start date of 1st contract',
      'End date of 1st contract',
      'End date of 2nd contract',
      'NGÀY BẮT ĐẦU LÀM VIỆC / Joining date',
      'THỜI GIAN LÀM VIỆC / Time of Service',
      'NGÀY NGHỈ VIỆC / Resignation date',
      'LÝ DO NGHỈ VIỆC / Resignation Reason',
      'PHỤ CẤP NHÀ Ở / House Subsidy',
      'GHI CHÚ / Remark'
    ]
  ];

  const rows = employees.map((emp, index) => [
    index + 1,
    emp.fullName,
    emp.gender === 'Male' ? 'Nam / Male' : emp.gender === 'Female' ? 'Nữ / Female' : emp.gender,
    emp.employeeId,
    formatDateDisplay(emp.dateOfBirth),
    emp.nationality,
    emp.ethnicity,
    emp.nativePlace,
    emp.permanentAddress,
    emp.phoneNumber,
    emp.idCardNumber,
    emp.oldIdCardNumber || '',
    formatDateDisplay(emp.idIssueDate),
    emp.idIssuePlace,
    emp.educationDegree,
    emp.technicalProfession,
    emp.rankLevel,
    emp.workingArea,
    emp.position,
    emp.department,
    emp.contractType,
    formatDateDisplay(emp.contract1StartDate),
    formatDateDisplay(emp.contract1EndDate),
    formatDateDisplay(emp.contract2EndDate),
    formatDateDisplay(emp.joiningDate),
    emp.timeOfService,
    emp.resignationDate ? formatDateDisplay(emp.resignationDate) : '',
    emp.resignationReason || '',
    emp.houseSubsidy || '',
    emp.remark || ''
  ]);

  const allData = [...headerData, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(allData);

  // Column widths
  worksheet['!cols'] = [
    { wch: 6 }, // STT
    { wch: 24 }, // Họ và tên
    { wch: 12 }, // Giới tính
    { wch: 14 }, // Mã NV
    { wch: 14 }, // Ngày sinh
    { wch: 14 }, // Quốc tịch
    { wch: 12 }, // Dân tộc
    { wch: 22 }, // Quê quán
    { wch: 32 }, // Hộ khẩu thường trú
    { wch: 16 }, // SĐT
    { wch: 16 }, // CMND/CCCD
    { wch: 14 }, // CMND cũ
    { wch: 14 }, // Ngày cấp
    { wch: 22 }, // Nơi cấp
    { wch: 14 }, // Trình độ
    { wch: 28 }, // Chuyên môn
    { wch: 18 }, // Cấp bậc
    { wch: 22 }, // Khu vực làm việc
    { wch: 30 }, // Vị trí
    { wch: 16 }, // Bộ phận
    { wch: 16 }, // Loại HĐLĐ
    { wch: 16 }, // HĐLĐ lần 1
    { wch: 16 }, // Hết hạn HĐ 1
    { wch: 16 }, // Hết hạn HĐ 2
    { wch: 16 }, // Ngày vào
    { wch: 14 }, // Thời gian làm việc
    { wch: 16 }, // Ngày nghỉ
    { wch: 30 }, // Lý do nghỉ
    { wch: 18 }, // Phụ cấp
    { wch: 30 }  // Ghi chú
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'So_Quan_Ly_Lao_Dong');
  XLSX.writeFile(workbook, fileName);
}

export function importLaborBookFromExcel(file: File): Promise<Employee[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Find header row (usually contains 'HỌ VÀ TÊN' or 'Full Name')
        let headerRowIdx = -1;
        for (let i = 0; i < Math.min(jsonData.length, 10); i++) {
          const rowStr = (jsonData[i] || []).join(' ').toLowerCase();
          if (rowStr.includes('họ và tên') || rowStr.includes('full name') || rowStr.includes('mã số')) {
            headerRowIdx = i;
            break;
          }
        }

        const dataRows = headerRowIdx >= 0 ? jsonData.slice(headerRowIdx + 1) : jsonData;
        const parsedEmployees: Employee[] = [];

        dataRows.forEach((row, idx) => {
          if (!row || row.length === 0 || !row[1]) return; // empty row or no name
          const fullName = String(row[1] || '').trim();
          if (!fullName) return;

          const employee: Employee = {
            id: `emp-import-${Date.now()}-${idx}`,
            stt: typeof row[0] === 'number' ? row[0] : idx + 1,
            fullName,
            gender: String(row[2] || '').toLowerCase().includes('nữ') || String(row[2] || '').toLowerCase().includes('female') ? 'Female' : 'Male',
            employeeId: String(row[3] || `DH${1000 + idx + 1}`),
            dateOfBirth: String(row[4] || ''),
            nationality: String(row[5] || 'Việt Nam'),
            ethnicity: String(row[6] || ''),
            nativePlace: String(row[7] || ''),
            permanentAddress: String(row[8] || ''),
            phoneNumber: String(row[9] || ''),
            idCardNumber: String(row[10] || ''),
            oldIdCardNumber: String(row[11] || ''),
            idIssueDate: String(row[12] || ''),
            idIssuePlace: String(row[13] || ''),
            educationDegree: String(row[14] || 'Đại học'),
            technicalProfession: String(row[15] || ''),
            rankLevel: String(row[16] || ''),
            workingArea: String(row[17] || ''),
            position: String(row[18] || ''),
            department: String(row[19] || 'Sản xuất'),
            contractType: String(row[20] || '1 year'),
            contract1StartDate: String(row[21] || ''),
            contract1EndDate: String(row[22] || ''),
            contract2EndDate: String(row[23] || ''),
            joiningDate: String(row[24] || ''),
            timeOfService: row[25] !== undefined ? row[25] : 0,
            resignationDate: String(row[26] || ''),
            resignationReason: String(row[27] || ''),
            houseSubsidy: String(row[28] || ''),
            remark: String(row[29] || '')
          };

          parsedEmployees.push(employee);
        });

        resolve(parsedEmployees);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}
