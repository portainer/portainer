import { Upload } from 'lucide-react';

import { BoxSelectorOption } from '@@/BoxSelector';

export const restoreOptions: ReadonlyArray<BoxSelectorOption<string>> = [
  {
    id: 'restore_file',
    value: 'file',
    icon: Upload,
    iconType: 'badge',
    label: 'Upload backup file',
  },
] as const;
