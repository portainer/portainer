import { useMutation } from '@tanstack/react-query';

import axios from '@/react/portainer/services/axios/axios';
import { withError } from '@/react-tools/react-query';

import { LDAPGroupSearchSettings } from '../types';

const DEFAULT_GROUP_FILTER = '(objectClass=groupOfNames)';

interface AdminGroupsPayload {
  AdminGroupSearchSettings: LDAPGroupSearchSettings[];
  AdminGroups?: string[];
}

async function fetchAdminGroups(
  settings: AdminGroupsPayload
): Promise<string[]> {
  const payload: AdminGroupsPayload = {
    ...settings,
    AdminGroupSearchSettings: settings.AdminGroupSearchSettings.map((s) => ({
      ...s,
      GroupFilter: s.GroupFilter || DEFAULT_GROUP_FILTER,
    })),
  };
  const { data } = await axios.post<string[]>('/ldap/admin-groups', {
    LDAPSettings: payload,
  });
  return data;
}

export function useAdminGroupsMutation() {
  return useMutation({
    mutationFn: fetchAdminGroups,
    ...withError('Failed to search admin groups'),
  });
}
