import { Profile } from '@/portainer/hostmanagement/fdo/model';

import { buildNameColumn } from '@@/datatables/buildNameColumn';

import { created } from './created';

export const columns = [
  buildNameColumn<Profile>(
    'name',
    'portainer.endpoints.profile.edit',
    'fdo-profiles-name'
  ),
  created,
];
