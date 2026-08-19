interface BaseActivityLog {
  timestamp: number;
  action: string;
  context: string;
  id: number;
  username: string;
}
export interface ActivityLogResponse extends BaseActivityLog {
  payload: string;
}

export interface ActivityLog extends BaseActivityLog {
  payload: string | object;
}

export interface ActivityLogsResponse {
  logs: Array<ActivityLogResponse>;
  totalCount: number;
}
