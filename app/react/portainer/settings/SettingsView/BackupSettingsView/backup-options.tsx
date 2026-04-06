import { DownloadCloud, UploadCloud } from 'lucide-react';

import i18n from '@/i18n';
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
    label: i18n.t('settings.backup_download_option'),
    value: BackupFormType.File,
  },
  {
    id: 'backup_s3',
    icon: <BadgeIcon icon={UploadCloud} />,
    label: i18n.t('settings.backup_s3_option'),
    description: i18n.t('settings.backup_s3_desc'),
    value: BackupFormType.S3,
    feature: FeatureId.S3_BACKUP_SETTING,
  },
];
