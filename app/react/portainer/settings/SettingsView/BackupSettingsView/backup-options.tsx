import { DownloadCloud, UploadCloud } from 'lucide-react';

import { FeatureId } from '@/react/portainer/feature-flags/enums';

import { BadgeIcon } from '@@/BadgeIcon';

export const backupFormType = {
  S3: 's3',
  File: 'file',
};

export const options = [
  {
    id: 'backup_file_1',
    icon: <BadgeIcon icon={DownloadCloud} />,
    label: 'Download backup file',
    value: backupFormType.File,
  },
  {
    id: 'backup_s3_1',
    icon: <BadgeIcon icon={UploadCloud} />,
    label: 'Store in S3',
    description: 'Define a cron schedule',
    value: backupFormType.S3,
    feature: FeatureId.S3_BACKUP_SETTING,
  },
];
