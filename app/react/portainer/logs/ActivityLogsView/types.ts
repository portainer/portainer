export interface ActivityLog {
  timestamp: number;
  action: string;
  context: string;
  id: number;
  payload: object;
  username: string;
}
