export interface BackupS3Model {
  cronRule: string;
  accessKeyID: string;
  secretAccessKey: string;
  region: string;
  bucketName: string;
  password: string;
  s3CompatibleHost: string;
}

export interface BackupS3Settings {
  passwordProtectS3: boolean;
  passwordS3: string;
  scheduleAutomaticBackup: boolean;
  cronRule: string;
  accessKeyID: string;
  secretAccessKey: string;
  region: string;
  bucketName: string;
  s3CompatibleHost: string;
}

export interface BackupFileSettings {
  passwordProtect: boolean;
  password: string;
}

export interface DownloadBackupPayload {
  password: string;
}
