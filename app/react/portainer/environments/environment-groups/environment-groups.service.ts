import axios, { parseAxiosError } from '@/portainer/services/axios';

import { buildUrl } from './queries/build-url';
import { EnvironmentGroup, EnvironmentGroupId } from './types';

export async function getGroup(id: EnvironmentGroupId) {
  try {
    const { data: group } = await axios.get<EnvironmentGroup>(buildUrl(id));
    return group;
  } catch (e) {
    throw parseAxiosError(e as Error, '');
  }
}

export async function getGroups() {
  try {
    const { data: groups } = await axios.get<EnvironmentGroup[]>(buildUrl());
    return groups;
  } catch (e) {
    throw parseAxiosError(e as Error, '');
  }
}
