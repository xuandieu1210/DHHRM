import { Employee, ContractExpiryStatus } from '../types/employee';

function getTodayAtMidnight(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export function parseDateString(dateStr?: string): Date | null {
  if (!dateStr || dateStr.trim() === '') return null;
  const trimmed = dateStr.trim();

  // Recover Excel serial dates that may already have been stored as strings.
  if (/^\d{5,7}$/.test(trimmed)) {
    const serial = Number(trimmed);
    if (serial <= 2958465) {
      const date = new Date(1899, 11, 30 + serial);
      return isNaN(date.getTime()) ? null : date;
    }
  }

  // If format is YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return isNaN(d.getTime()) ? null : d;
  }

  // If format is DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const [day, month, year] = trimmed.split('/').map(Number);
    const d = new Date(year, month - 1, day);
    return isNaN(d.getTime()) ? null : d;
  }

  // If format is M/D/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const parts = trimmed.split('/').map(Number);
    // fallback check
    const d = new Date(parts[2], parts[0] - 1, parts[1]);
    return isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d;
}

export function formatDateInputValue(dateStr?: string): string {
  if (!dateStr || dateStr.trim() === '') return '';
  const trimmed = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const parsed = parseDateString(trimmed);
  if (!parsed) return '';
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateDisplay(dateStr?: string): string {
  if (!dateStr || dateStr.trim() === '') return '-';
  const parsed = parseDateString(dateStr);
  if (!parsed) return dateStr;

  const day = String(parsed.getDate()).padStart(2, '0');
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const year = parsed.getFullYear();
  return `${day}/${month}/${year}`;
}

export function calculateMonthsOfService(joiningDateStr?: string, resignationDateStr?: string, referenceDate: Date = getTodayAtMidnight()): number {
  const joining = parseDateString(joiningDateStr);
  if (!joining) return 0;

  const end = resignationDateStr ? parseDateString(resignationDateStr) || referenceDate : referenceDate;

  let months = (end.getFullYear() - joining.getFullYear()) * 12 + (end.getMonth() - joining.getMonth());
  if (end.getDate() >= joining.getDate()) {
    // completed full month
  } else {
    months = Math.max(0, months - 1);
  }
  return Math.max(0, months);
}

export function getActiveContractEndDate(emp: Employee): string | null {
  if (emp.contract2EndDate && emp.contract2EndDate.trim() !== '') {
    return emp.contract2EndDate;
  }
  if (emp.contract1EndDate && emp.contract1EndDate.trim() !== '') {
    return emp.contract1EndDate;
  }
  return null;
}

export function getContractExpiryStatus(emp: Employee, refDate: Date = getTodayAtMidnight()): {
  status: ContractExpiryStatus;
  daysRemaining: number | null;
  label: string;
} {
  if (emp.resignationDate && emp.resignationDate.trim() !== '') {
    return {
      status: 'resigned',
      daysRemaining: null,
      label: 'Đã thôi việc'
    };
  }

  if (
    emp.contractType.toLowerCase().includes('không xác định') ||
    emp.contractType.toLowerCase().includes('indefinite') ||
    emp.contractType.toLowerCase().includes('vô thời hạn')
  ) {
    return {
      status: 'indefinite',
      daysRemaining: null,
      label: 'Không thời hạn'
    };
  }

  const endDateStr = getActiveContractEndDate(emp);
  if (!endDateStr) {
    return {
      status: 'active',
      daysRemaining: null,
      label: 'Đang hiệu lực'
    };
  }

  const endDate = parseDateString(endDateStr);
  if (!endDate) {
    return {
      status: 'active',
      daysRemaining: null,
      label: 'Đang hiệu lực'
    };
  }

  const endDay = Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  const referenceDay = Date.UTC(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());
  const diffDays = Math.round((endDay - referenceDay) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      status: 'expired',
      daysRemaining: diffDays,
      label: `Đã quá hạn (${Math.abs(diffDays)} ngày)`
    };
  }

  if (diffDays <= 60) {
    return {
      status: 'warning',
      daysRemaining: diffDays,
      label: `Hết hạn sau ${diffDays} ngày`
    };
  }

  return {
    status: 'active',
    daysRemaining: diffDays,
    label: `Còn ${diffDays} ngày`
  };
}
