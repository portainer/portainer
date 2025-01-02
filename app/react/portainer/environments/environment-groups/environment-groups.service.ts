import axios, { parseAxiosError } from '@/portainer/services/axios';

import { EnvironmentGroupId } from '../types';

import { buildUrl } from './queries/build-url';
import { EnvironmentGroup } from './types';

export async function getGroup(id: EnvironmentGroupId) {
  try {
    const { data: group } = await axios.get<EnvironmentGroup>(buildUrl(id));
    return group;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to retrieve group');
  }
}

export async function getGroups() {
  try {
    const { data: groups } = await axios.get<EnvironmentGroup[]>(buildUrl());
    return groups;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to retrieve groups');
  }
}
