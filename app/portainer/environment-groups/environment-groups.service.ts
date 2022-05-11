import axios, { parseAxiosError } from '../services/axios';

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

function buildUrl(id?: EnvironmentGroupId, action?: string) {
  let url = '/endpoint_groups';

  if (id) {
    url += `/${id}`;
  }

  if (action) {
    url += `/${action}`;
  }

  return url;
}
