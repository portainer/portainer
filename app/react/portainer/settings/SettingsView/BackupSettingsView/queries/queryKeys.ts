export const queryKeys = {
  base: () => ['settings'] as const,
  backupS3Settings: () => [...queryKeys.base(), 'backupS3Settings'] as const,
  downloadBackup: () => [...queryKeys.base(), 'downloadBackup'] as const,
  exportS3Backup: () => [...queryKeys.base(), 'exportS3Backup'] as const,
};
