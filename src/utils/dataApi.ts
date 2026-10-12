import { Employee } from '../types/employee';
import { InterviewCandidate } from '../types/recruitment';
import { EmployeeSalary } from '../types/salary';
import { UserAccount } from '../types/auth';

export interface AppData {
  employees: Employee[];
  candidates: InterviewCandidate[];
  salaries: EmployeeSalary[];
  users: UserAccount[];
}

export type DataCollection = 'employees' | 'candidates' | 'salaries';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!response.ok) {
    const result = await response.json().catch(() => null);
    throw new Error(result?.error || `API request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export function getSession() {
  return request<{ user: UserAccount | null }>('/api/auth/session');
}

export function login(username: string, password: string) {
  return request<{ user: UserAccount }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function logout() {
  return request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' });
}

export function loadAppData() {
  return request<AppData>('/api/data');
}

export function saveCollection(collection: DataCollection, records: AppData[DataCollection]) {
  return request<{ ok: boolean }>(`/api/data/${collection}`, {
    method: 'PUT',
    body: JSON.stringify({ records }),
  });
}

export function resetAppData() {
  return request<{ ok: boolean }>('/api/data/reset', { method: 'POST' });
}

export function saveUsers(users: UserAccount[], passwordUserId?: string, password?: string) {
  const records = users.map((user) => user.id === passwordUserId && password
    ? { ...user, password }
    : user);
  return request<{ ok: boolean }>('/api/data/users', {
    method: 'PUT',
    body: JSON.stringify({ records }),
  });
}