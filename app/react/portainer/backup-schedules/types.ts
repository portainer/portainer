export interface RetentionPolicy {
  Hours: number;
  Days: number;
  Weeks: number;
  Months: number;
  Years: number;
}

export interface BackupSchedule {
  Id: number;
  Name: string;
  EndpointId: number;
  Schedule: string;
  Include: string[];
  Exclude: string[];
  Retention: RetentionPolicy;
  TargetType: string;
  TargetDetails: Record<string, unknown>;
  Created: number;
  Status: string;
  LastRun: number;
}
