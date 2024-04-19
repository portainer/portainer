import { useMutation } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { withError } from '@/react-tools/react-query';
import { notifySuccess } from '@/portainer/services/notifications';

import { ApiKeyFormValues } from './types';

export interface ApiKeyResponse {
  rawAPIKey: string;
}

export function useCreateUserAccessTokenMutation() {
  return useMutation(createUserAccessToken, {
    ...withError('Unable to create access token'),
    onSuccess: () => {
      notifySuccess('Success', 'Access token successfully created');
      // TODO: invalidate query when user page migrated to react.
    },
  });
}

async function createUserAccessToken({
  values,
  userid,
}: {
  values: ApiKeyFormValues;
  userid: number;
}) {
  try {
    const response = await axios.post<ApiKeyResponse>(
      `/users/${userid}/tokens`,
      values
    );
    return response.data.rawAPIKey;
  } catch (e) {
    throw parseAxiosError(e);
  }
}
