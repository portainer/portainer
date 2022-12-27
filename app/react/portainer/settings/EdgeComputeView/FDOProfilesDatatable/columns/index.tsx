import { Profile } from '@/portainer/hostmanagement/fdo/model';

import { buildNameColumn } from '@@/datatables/NameCell';

import { created } from './created';

export const columns = [
  buildNameColumn<Profile>('name', 'id', 'portainer.endpoints.profile.edit'),
  created,
];
