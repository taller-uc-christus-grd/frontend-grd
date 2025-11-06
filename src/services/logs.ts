import api from '@/lib/api';

export interface SystemLog {
  id: string;
  user: string;
  userName: string;
  action: string;
  timestamp: string;
  type: 'success' | 'error' | 'warning' | 'info';
  ip: string;
  details: string;
  level?: string;
  endpoint?: string;
  metadata?: any;
}

export interface LogsResponse {
  logs: SystemLog[];
  total: number;
  limit: number;
  offset: number;
}

export interface LogsFilters {
  level?: string;
  limit?: number;
  offset?: number;
  userId?: number;
  startDate?: string;
  endDate?: string;
}

// Obtener logs del sistema
export async function getLogs(filters?: LogsFilters): Promise<LogsResponse> {
  const params = new URLSearchParams();
  
  if (filters?.level) {
    params.append('level', filters.level);
  }
  if (filters?.limit) {
    params.append('limit', filters.limit.toString());
  }
  if (filters?.offset) {
    params.append('offset', filters.offset.toString());
  }
  if (filters?.userId) {
    params.append('userId', filters.userId.toString());
  }
  if (filters?.startDate) {
    params.append('startDate', filters.startDate);
  }
  if (filters?.endDate) {
    params.append('endDate', filters.endDate);
  }
  
  const queryString = params.toString();
  const url = queryString ? `/api/logs?${queryString}` : '/api/logs';
  
  const response = await api.get<LogsResponse>(url);
  return response.data;
}

