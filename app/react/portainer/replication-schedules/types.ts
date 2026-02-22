export interface FailoverSettings {
  Enabled: boolean;
  Timeout: string;
  TargetPriorities: number[];
}

export interface ReplicationSchedule {
  Id: number;
  Name: string;
  SourceId: number;
  TargetId: number;
  Schedule: string;
  Include: string[];
  Exclude: string[];
  FailoverSettings: FailoverSettings;
  Created: number;
  Status: string;
  LastRun: number;
}
