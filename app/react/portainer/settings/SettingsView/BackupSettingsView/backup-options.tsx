import { DownloadCloud, UploadCloud } from 'lucide-react';

import { FeatureId } from '@/react/portainer/feature-flags/enums';

import { BadgeIcon } from '@@/BadgeIcon';

export enum BackupFormType {
  S3 = 's3',
  File = 'file',
}

export const options = [
  {
    id: 'backup_file',
    icon: <BadgeIcon icon={DownloadCloud} />,
    label: 'Download backup file',
    value: BackupFormType.File,
  },
  {
    id: 'backup_s3',
    icon: <BadgeIcon icon={UploadCloud} />,
    label: 'Store in S3',
    description: 'Define a cron schedule',
    value: BackupFormType.S3,
    feature: FeatureId.S3_BACKUP_SETTING,
  },
];
