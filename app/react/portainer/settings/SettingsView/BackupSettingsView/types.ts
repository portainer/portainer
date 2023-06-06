export interface BackupS3Model {
  cronRule: string;
  accessKeyID: string;
  secretAccessKey: string;
  region: string;
  bucketName: string;
  password: string;
  s3CompatibleHost: string;
}
