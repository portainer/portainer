import { useQuery } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';

import { RbacRole } from './types';

export function useRbacRoles<T = Array<RbacRole>>({
  select,
}: {
  select: (roles: Array<RbacRole>) => T;
}) {
  return useQuery({
    select,
    queryKey: ['roles'],
    queryFn: async () => {
      try {
        const { data } = await axios.get<Array<RbacRole>>('/roles');

        return data;
      } catch (e) {
        throw parseAxiosError(e, 'Failed to fetch roles');
      }
    },
  });
}
