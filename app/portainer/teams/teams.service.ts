import axios, { parseAxiosError } from '@/portainer/services/axios';

import { Team, TeamId } from './types';

export async function getTeams() {
  try {
    const { data } = await axios.get<Team[]>(buildUrl());
    return data;
  } catch (error) {
    throw parseAxiosError(error as Error);
  }
}

function buildUrl(id?: TeamId) {
  let url = '/teams';

  if (id) {
    url += `/${id}`;
  }

  return url;
}
