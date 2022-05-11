import axios, { parseAxiosError } from '@/portainer/services/axios';

import { TeamMembership } from '../teams/types';

import { User, UserId } from './types';
import { filterNonAdministratorUsers } from './user.helpers';

export async function getUsers(includeAdministrators = false) {
  try {
    const { data } = await axios.get<User[]>(buildUrl());

    return includeAdministrators ? data : filterNonAdministratorUsers(data);
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to retrieve users');
  }
}

export async function getUser(id: UserId) {
  try {
    const { data: user } = await axios.get<User>(buildUrl(id));

    return user;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to retrieve user details');
  }
}

export async function getUserMemberships(id?: UserId) {
  try {
    if (!id) {
      throw new Error('missing id');
    }

    const { data } = await axios.get<TeamMembership[]>(
      buildUrl(id, 'memberships')
    );
    return data;
  } catch (err) {
    throw parseAxiosError(err as Error, 'Unable to retrieve user memberships');
  }
}

function buildUrl(id?: UserId, entity?: string) {
  let url = '/users';

  if (id) {
    url += `/${id}`;
  }

  if (entity) {
    url += `/${entity}`;
  }

  return url;
}
