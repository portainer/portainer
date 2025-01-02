import { UserId } from '@/portainer/users/types';

import { AccessToken } from '../types';

export function buildUrl(userId: UserId, id?: AccessToken['id']) {
  const baseUrl = `/users/${userId}/tokens`;
  return id ? `${baseUrl}/${id}` : baseUrl;
}
