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
  passwordProtect: boolean;
  password: string;
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
