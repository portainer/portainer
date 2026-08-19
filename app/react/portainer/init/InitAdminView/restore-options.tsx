import { Download, Upload } from 'lucide-react';

import { FeatureId } from '@/react/portainer/feature-flags/enums';

import { BoxSelectorOption } from '@@/BoxSelector';

export const restoreOptions: ReadonlyArray<BoxSelectorOption<string>> = [
  {
    id: 'restore_file',
    value: 'file',
    icon: Upload,
    iconType: 'badge',
    label: 'Upload backup file',
  },
  {
    id: 'restore_s3',
    value: 's3',
    icon: Download,
    iconType: 'badge',
    label: 'Retrieve from S3',
    feature: FeatureId.S3_RESTORE,
  },
] as const;
