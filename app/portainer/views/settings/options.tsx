import { Download, Upload } from 'react-feather';

import { FeatureId } from '@/portainer/feature-flags/enums';

import { BadgeIcon } from '@@/BoxSelector/BadgeIcon';

export const options = [
  {
    id: 'backup_file',
    icon: <BadgeIcon icon={Download} />,
    featherIcon: true,
    label: 'Download backup file',
    value: 'file',
  },
  {
    id: 'backup_s3',
    icon: <BadgeIcon icon={Upload} />,
    featherIcon: true,
    label: 'Store in S3',
    description: 'Define a cron schedule',
    value: 's3',
    feature: FeatureId.S3_BACKUP_SETTING,
  },
];
