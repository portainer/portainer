export interface BackupS3Model {
  CronRule: string;
  AccessKeyID: string;
  SecretAccessKey: string;
  Region: string;
  BucketName: string;
  Password: string;
  S3CompatibleHost: string;
}

export interface BackupSettingsModel extends BackupS3Model {
  PasswordProtect: boolean;
  ScheduleAutomaticBackup: boolean;
}

export interface FormValues extends BackupSettingsModel {
  BackupFormType: string;
}

export interface DownloadBackupPayload {
  password: string;
}
