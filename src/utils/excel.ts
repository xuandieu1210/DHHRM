import * as XLSX from 'xlsx';
import { Employee } from '../types/employee';
import { EmployeeSalary } from '../types/salary';
import { COMPANY_INFO } from '../data/initialEmployees';
import { formatDateDisplay } from './dateUtils';
import { getNextEmployeeIdNumber } from './employeeIds';

const LABOR_IMPORT_HEADERS = [
  'STT / No.', 'HỌ VÀ TÊN / Full Name', 'GIỚI TÍNH / Gender', 'MÃ SỐ NHÂN VIÊN / Emp. ID',
  'NGÀY SINH / DOB', 'QUỐC TỊCH / Nationality', 'Dân tộc / Ethnicity', 'QUÊ QUÁN / Native place',
  'HỘ KHẨU THƯỜNG TRÚ / Permanent Address', 'SỐ ĐIỆN THOẠI / Phone number', 'CMND/CCCD / ID Card',
  'Số CMND cũ / Old ID', 'NGÀY CẤP / Issue date of ID card', 'NƠI CẤP / Place of issue',
  'TRÌNH ĐỘ / Degree', 'CHUYÊN MÔN KỸ THUẬT / Profession', 'CẤP BẬC / Level',
  'KHU VỰC LÀM VIỆC / Working Area', 'VỊ TRÍ LÀM VIỆC / Position', 'BỘ PHẬN / Department',
  'LOẠI HĐLĐ / Contract type', 'HỢP ĐỒNG LAO ĐỘNG LẦN 1 / Start date of 1st contract',
  'End date of 1st contract', 'End date of 2nd contract', 'NGÀY BẮT ĐẦU LÀM VIỆC / Joining date',
  'THỜI GIAN LÀM VIỆC / Time of Service', 'NGÀY NGHỈ VIỆC / Resignation date',
  'LÝ DO NGHỈ VIỆC / Resignation Reason', 'PHỤ CẤP NHÀ Ở / House Subsidy', 'GHI CHÚ / Remark'
];

const SALARY_IMPORT_HEADERS = [
  'Mã NV', 'Đơn vị tiền', 'Lương cơ bản', 'Phụ cấp chức vụ', 'Phụ cấp trách nhiệm',
  'Trợ cấp xăng xe', 'Trợ cấp điện thoại', 'Trợ cấp ngôn ngữ', 'Trợ cấp nội quy',
  'Hỗ trợ trang phục', 'Trợ cấp năng lực', 'Trợ cấp nhà ở', 'Trợ cấp đi lại',
  'Trợ cấp sinh hoạt phí (35.000 VND/ngày)', 'Hỗ trợ tiền ăn (40.000 VND/ngày)',
  'Phụ cấp đội PCCC', 'Phụ cấp ATVSV', 'Ngày hiệu lực', 'Ghi chú'
];

const INTERVIEW_IMPORT_HEADERS = [
  'STT', 'Ngày PV', 'Giờ PV', 'Họ và Tên', 'SĐT', 'Email', 'Vị trí ứng tuyển',
  'Bộ phận', 'Người PV', 'Địa điểm', 'Kết quả PV', 'Lương đề xuất', 'Nhận xét'
];

function downloadImportTemplate(
  fileName: string,
  sheetName: string,
  headers: string[],
  guideRows: string[][]
) {
  const workbook = XLSX.utils.book_new();
  const dataSheet = XLSX.utils.aoa_to_sheet([headers]);
  dataSheet['!cols'] = headers.map((header) => ({ wch: Math.min(Math.max(header.length + 2, 14), 34) }));
  XLSX.utils.book_append_sheet(workbook, dataSheet, sheetName);
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(guideRows), 'Huong_dan');
  XLSX.writeFile(workbook, fileName);
}

export function downloadLaborBookImportTemplate() {
  downloadImportTemplate(
    'Mau_Import_So_Lao_Dong.xlsx',
    'Import_Lao_Dong',
    LABOR_IMPORT_HEADERS,
    [
      ['Hướng dẫn nhập hồ sơ lao động'],
      ['Mỗi dòng là một nhân viên; nhập dữ liệu từ dòng 2 của sheet Import_Lao_Dong.'],
      ['Họ và tên và Mã số nhân viên cần có giá trị duy nhất.'],
      ['Ngày nhập theo định dạng YYYY-MM-DD; giới tính dùng Male, Female hoặc Other.']
    ]
  );
}

export function downloadSalaryImportTemplate() {
  downloadImportTemplate(
    'Mau_Import_Bang_Luong.xlsx',
    'Import_Luong',
    SALARY_IMPORT_HEADERS,
    [
      ['Hướng dẫn nhập bảng lương'],
      ['Mã NV phải tồn tại trong Sổ Quản Lý Lao Động; dữ liệu nhân viên sẽ lấy theo mã này.'],
      ['Đơn vị tiền nhập VND hoặc USD; các khoản tiền nhập dạng số, không kèm ký hiệu tiền tệ.'],
      ['Khoản/ngày nhập trực tiếp theo số tiền, không tự nhân với ngày công.'],
      ['Ngày hiệu lực nhập theo định dạng YYYY-MM-DD. Cùng Mã NV và Ngày hiệu lực sẽ được cập nhật.']
    ]
  );
}

export function downloadInterviewImportTemplate() {
  downloadImportTemplate(
    'Mau_Import_Lich_Phong_Van.xlsx',
    'Import_Phong_Van',
    INTERVIEW_IMPORT_HEADERS,
    [
      ['Hướng dẫn nhập lịch phỏng vấn'],
      ['Mỗi dòng là một ứng viên; nhập dữ liệu từ dòng 2 của sheet Import_Phong_Van.'],
      ['Ngày PV dùng YYYY-MM-DD, Giờ PV dùng HH:mm.'],
      ['Kết quả PV có thể để trống hoặc dùng: Chờ phỏng vấn, Đã PV - Chờ kết quả, Trúng tuyển, Đã nhận việc, Không đạt, Hủy hẹn.']
    ]
  );
}

function normalizeHeader(value: unknown) {
  return String(value || '').trim().toLowerCase();
}

function parseImportDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value);
    if (date) return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
  }
  const text = String(value || '').trim();
  const isoDate = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoDate) return `${isoDate[1]}-${isoDate[2].padStart(2, '0')}-${isoDate[3].padStart(2, '0')}`;
  const localDate = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (localDate) return `${localDate[3]}-${localDate[2].padStart(2, '0')}-${localDate[1].padStart(2, '0')}`;
  return text;
}

function parseImportNumber(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const parsed = Number(String(value || '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function importSalariesFromExcel(file: File, employees: Employee[]): Promise<EmployeeSalary[]> {
  const data = new Uint8Array(await file.arrayBuffer());
  const workbook = XLSX.read(data, { type: 'array', cellDates: true });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!worksheet) throw new Error('Không tìm thấy sheet dữ liệu trong file.');

  const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, defval: '' });
  const headerRowIndex = rows.findIndex((row) => row.some((cell) => {
    const header = normalizeHeader(cell);
    return header === 'mã nv' || header === 'mã nhân viên' || header === 'employee id';
  }));
  if (headerRowIndex < 0) throw new Error('Không tìm thấy cột Mã NV trong file mẫu lương.');

  const headers = rows[headerRowIndex].map(normalizeHeader);
  const column = (names: string[]) => headers.findIndex((header) => names.includes(header));
  const columns = {
    employeeId: column(['mã nv', 'mã nhân viên', 'employee id']),
    currency: column(['đơn vị tiền', 'currency']),
    basicSalary: column(['lương cơ bản', 'basic salary']),
    positionAllowance: column(['phụ cấp chức vụ', 'position allowance']),
    responsibleAllowance: column(['phụ cấp trách nhiệm', 'responsible allowance']),
    petrolSubsidy: column(['trợ cấp xăng xe', 'petrol subsidy']),
    phoneSubsidy: column(['trợ cấp điện thoại', 'phone subsidy']),
    languageSubsidy: column(['trợ cấp ngôn ngữ', 'language subsidy']),
    regulationSubsidy: column(['trợ cấp nội quy', 'regulation compliance subsidy']),
    uniformSubsidy: column(['hỗ trợ trang phục', 'uniform subsidy']),
    abilityAllowance: column(['trợ cấp năng lực', 'ability allowance']),
    houseSubsidy: column(['trợ cấp nhà ở', 'house subsidy']),
    transportationSubsidy: column(['trợ cấp đi lại', 'transportation subsidy']),
    livingExpenseSubsidy: column(['trợ cấp sinh hoạt phí (35.000 vnd/ngày)', 'trợ cấp sinh hoạt phí', 'trợ cấp xa nhà', 'living expense subsidy']),
    mealAllowance: column(['hỗ trợ tiền ăn (40.000 vnd/ngày)', 'hỗ trợ tiền ăn', 'tiền ăn', 'meal allowance']),
    firePreventionSubsidy: column(['phụ cấp đội pccc', 'fire prevention team subsidy']),
    oshTeamSubsidy: column(['phụ cấp atvsv', 'osh team subsidy']),
    effectiveDate: column(['ngày hiệu lực', 'effective date']),
    notes: column(['ghi chú', 'notes'])
  };
  if (columns.employeeId < 0 || columns.basicSalary < 0) {
    throw new Error('File cần có các cột Mã NV và Lương cơ bản.');
  }

  const getValue = (row: unknown[], key: keyof typeof columns) => {
    const index = columns[key];
    return index >= 0 ? row[index] : '';
  };
  const imported: EmployeeSalary[] = [];
  rows.slice(headerRowIndex + 1).forEach((row, index) => {
    const employeeId = String(getValue(row, 'employeeId') || '').trim();
    if (!employeeId) return;

    const employee = employees.find((item) => item.employeeId.trim().toLowerCase() === employeeId.toLowerCase());
    if (!employee) {
      throw new Error(`Không tìm thấy Mã NV "${employeeId}" trong danh sách lao động (dòng ${headerRowIndex + index + 2}).`);
    }

    const currencyValue = String(getValue(row, 'currency') || 'VND').trim().toUpperCase();
    if (currencyValue !== 'VND' && currencyValue !== 'USD') {
      throw new Error(`Đơn vị tiền của ${employeeId} phải là VND hoặc USD.`);
    }
    const salary = {
      positionAllowance: parseImportNumber(getValue(row, 'positionAllowance')),
      responsibleAllowance: parseImportNumber(getValue(row, 'responsibleAllowance')),
      petrolSubsidy: parseImportNumber(getValue(row, 'petrolSubsidy')),
      phoneSubsidy: parseImportNumber(getValue(row, 'phoneSubsidy')),
      languageSubsidy: parseImportNumber(getValue(row, 'languageSubsidy')),
      regulationSubsidy: parseImportNumber(getValue(row, 'regulationSubsidy')),
      uniformSubsidy: parseImportNumber(getValue(row, 'uniformSubsidy')),
      abilityAllowance: parseImportNumber(getValue(row, 'abilityAllowance')),
      houseSubsidy: parseImportNumber(getValue(row, 'houseSubsidy')),
      transportationSubsidy: parseImportNumber(getValue(row, 'transportationSubsidy')),
      livingExpenseSubsidy: parseImportNumber(getValue(row, 'livingExpenseSubsidy')),
      mealAllowance: parseImportNumber(getValue(row, 'mealAllowance')),
      firePreventionSubsidy: parseImportNumber(getValue(row, 'firePreventionSubsidy')),
      oshTeamSubsidy: parseImportNumber(getValue(row, 'oshTeamSubsidy'))
    };
    const totalAllowance = Object.values(salary).reduce((sum, amount) => sum + amount, 0);
    const basicSalary = parseImportNumber(getValue(row, 'basicSalary'));
    const effectiveDate = parseImportDate(getValue(row, 'effectiveDate')) || new Date().toISOString().slice(0, 10);

    imported.push({
      id: `sal-import-${employee.employeeId}-${effectiveDate}-${index}`,
      employeeId: employee.employeeId,
      fullName: employee.fullName,
      department: employee.department,
      position: employee.position,
      currency: currencyValue,
      ...salary,
      totalAllowance,
      totalSalary: basicSalary + totalAllowance,
      basicSalary,
      effectiveDate,
      notes: String(getValue(row, 'notes') || '')
    });
  });

  return imported;
}

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

export function importLaborBookFromExcel(file: File, existingEmployees: Employee[] = []): Promise<Employee[]> {
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
        const usedEmployeeIds = new Set(existingEmployees.map(employee => employee.employeeId.trim().toUpperCase()));
        let nextTemporaryNumber = getNextEmployeeIdNumber('TV', Array.from(usedEmployeeIds));

        dataRows.forEach((row, idx) => {
          if (!row || row.length === 0 || !row[1]) return; // empty row or no name
          const fullName = String(row[1] || '').trim();
          if (!fullName) return;

          let employeeId = String(row[3] || '').trim();
          if (!employeeId) {
            employeeId = `TV${nextTemporaryNumber}`;
            while (usedEmployeeIds.has(employeeId.toUpperCase())) {
              nextTemporaryNumber += 1;
              employeeId = `TV${nextTemporaryNumber}`;
            }
            nextTemporaryNumber += 1;
          }
          usedEmployeeIds.add(employeeId.toUpperCase());

          const employee: Employee = {
            id: `emp-import-${Date.now()}-${idx}`,
            stt: typeof row[0] === 'number' ? row[0] : idx + 1,
            fullName,
            gender: String(row[2] || '').toLowerCase().includes('nữ') || String(row[2] || '').toLowerCase().includes('female') ? 'Female' : 'Male',
            employeeId,
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
