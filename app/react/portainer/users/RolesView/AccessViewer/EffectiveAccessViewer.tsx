import { useQuery } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { withError } from '@/react-tools/react-query';
import { UserId } from '@/portainer/users/types';

import { EffectiveAccessViewerDatatable } from './EffectiveAccessViewerDatatable';
import { AccessViewerPolicyModel } from './model';

export function EffectiveAccessViewer({ userId }: { userId: UserId | null }) {
  const query = useUserEffectiveAccess(userId);

  if (!userId) {
    return null;
  }

  return <EffectiveAccessViewerDatatable dataset={query.data ?? []} />;
}

function useUserEffectiveAccess(userId: UserId | null) {
  return useQuery({
    queryKey: ['users', userId, 'effective-access'],
    queryFn: () => getUserEffectiveAccess(userId as UserId),
    enabled: !!userId,
    ...withError('Unable to retrieve effective access'),
  });
}

async function getUserEffectiveAccess(userId: UserId) {
  try {
    const { data } = await axios.get<AccessViewerPolicyModel[]>(
      `/users/${userId}/effective-access`
    );
    return data;
  } catch (err) {
    throw parseAxiosError(err);
  }
}
