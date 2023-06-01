export interface BackupS3Model {
  CronRule: string;
  AccessKeyID: string;
  SecretAccessKey: string;
  Region: string;
  BucketName: string;
  Password: string;
  S3CompatibleHost: string;
}

export interface BackupS3Settings {
  PasswordProtectS3: boolean;
  PasswordS3: string;
  ScheduleAutomaticBackup: boolean;
  CronRule: string;
  AccessKeyID: string;
  SecretAccessKey: string;
  Region: string;
  BucketName: string;
  S3CompatibleHost: string;
}

export interface BackupFileSettings {
  PasswordProtect: boolean;
  Password: string;
}

export interface FormValues extends BackupFileSettings, BackupS3Settings {
  submitButton: string;
}

export interface DownloadBackupPayload {
  password: string;
}
