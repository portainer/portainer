import { FeatureId } from '@/portainer/feature-flags/enums';

export const options = [
  {
    id: 'backup_file',
    icon: 'download',
    featherIcon: true,
    label: 'Download backup file',
    value: 'file',
  },
  {
    id: 'backup_s3',
    icon: 'upload',
    featherIcon: true,
    label: 'Store in S3',
    description: 'Define a cron schedule',
    value: 's3',
    feature: FeatureId.S3_BACKUP_SETTING,
  },
];
