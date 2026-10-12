export function getNextEmployeeIdNumber(prefix: 'TV' | 'DH', employeeIds: string[]) {
  const pattern = new RegExp(`^${prefix}(\\d+)$`, 'i');
  const largestNumber = employeeIds.reduce((largest, employeeId) => {
    const match = employeeId.trim().match(pattern);
    return match ? Math.max(largest, Number(match[1])) : largest;
  }, 0);
  return largestNumber + 1;
}

export function createEmployeeId(prefix: 'TV' | 'DH', employeeIds: string[]) {
  const usedIds = new Set(employeeIds.map(employeeId => employeeId.trim().toUpperCase()));
  let number = getNextEmployeeIdNumber(prefix, employeeIds);
  let employeeId = `${prefix}${number}`;
  while (usedIds.has(employeeId)) {
    number += 1;
    employeeId = `${prefix}${number}`;
  }
  return employeeId;
}