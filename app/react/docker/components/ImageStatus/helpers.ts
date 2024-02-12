import { Loader } from 'lucide-react';

import UpdatesAvailable from '@/assets/ico/icon_updates-available.svg?c';
import UpToDate from '@/assets/ico/icon_up-to-date.svg?c';
import UpdatesUnknown from '@/assets/ico/icon_updates-unknown.svg?c';

import { ImageStatus } from './types';

export function statusIcon(status: ImageStatus) {
  switch (status.Status) {
    case 'outdated':
      return UpdatesAvailable;
    case 'updated':
      return UpToDate;
    case 'processing':
      return Loader;
    default:
      return UpdatesUnknown;
  }
}
