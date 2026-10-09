import { Employee } from '../types/employee';
import { parseDateString } from './dateUtils';
import { MonthlyStatsRecord } from '../types/recruitment';

export function getMonthlyWorkforceStats(employees: Employee[], year: number): MonthlyStatsRecord[] {
  const records: MonthlyStatsRecord[] = [];

  for (let m = 1; m <= 12; m++) {
    // End date of month m
    const endOfMonth = new Date(year, m, 0, 23, 59, 59); // Day 0 of next month is last day of current month
    const startOfMonth = new Date(year, m - 1, 1, 0, 0, 0);

    const joiners: MonthlyStatsRecord['joiners'] = [];
    const resignees: MonthlyStatsRecord['resignees'] = [];
    let activeCount = 0;

    employees.forEach(emp => {
      const joinDate = parseDateString(emp.joiningDate);
      const resignDate = emp.resignationDate ? parseDateString(emp.resignationDate) : null;

      // Check if employee joined in this month
      if (joinDate && joinDate >= startOfMonth && joinDate <= endOfMonth) {
        joiners.push({
          id: emp.id,
          fullName: emp.fullName,
          employeeId: emp.employeeId,
          department: emp.department,
          position: emp.position,
          joiningDate: emp.joiningDate
        });
      }

      // Check if employee resigned in this month
      if (resignDate && resignDate >= startOfMonth && resignDate <= endOfMonth) {
        resignees.push({
          id: emp.id,
          fullName: emp.fullName,
          employeeId: emp.employeeId,
          department: emp.department,
          position: emp.position,
          resignationDate: emp.resignationDate || '',
          reason: emp.resignationReason || 'Không ghi rõ lý do'
        });
      }

      // Check if employee was active at the end of this month
      if (joinDate && joinDate <= endOfMonth) {
        if (!resignDate || resignDate > endOfMonth) {
          activeCount++;
        }
      }
    });

    const turnoverRate = activeCount > 0 ? Number(((resignees.length / activeCount) * 100).toFixed(1)) : 0;

    records.push({
      month: m,
      monthLabel: `Tháng ${m}`,
      year,
      activeCount,
      newJoinersCount: joiners.length,
      resignedCount: resignees.length,
      turnoverRate,
      joiners,
      resignees
    });
  }

  return records;
}

export function getAvailableYears(employees: Employee[]): number[] {
  const years = new Set<number>();
  const currentYear = 2026;
  years.add(currentYear);
  years.add(currentYear - 1);
  years.add(currentYear - 2);

  employees.forEach(emp => {
    const jd = parseDateString(emp.joiningDate);
    if (jd) years.add(jd.getFullYear());
    if (emp.resignationDate) {
      const rd = parseDateString(emp.resignationDate);
      if (rd) years.add(rd.getFullYear());
    }
  });

  return Array.from(years).sort((a, b) => b - a);
}
