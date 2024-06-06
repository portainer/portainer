import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { success as notifySuccess } from '@/portainer/services/notifications';
import { UserId } from '@/portainer/users/types';

import { isBE } from '../../feature-flags/feature-flags.service';

import { GitCredential, UpdateGitCredentialPayload } from './types';

export async function getGitCredentials(userId: number) {
  try {
    const { data } = await axios.get<GitCredential[]>(buildGitUrl(userId));
    return data;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to get git credentials');
  }
}

export async function getGitCredential(userId: number, id: number) {
  try {
    const { data } = await axios.get<GitCredential>(buildGitUrl(userId, id));
    return data;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to get git credential');
  }
}

export async function deleteGitCredential(credential: GitCredential) {
  try {
    await axios.delete<GitCredential[]>(
      buildGitUrl(credential.userId, credential.id)
    );
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to delete git credential');
  }
}

export async function updateGitCredential(
  credential: Partial<UpdateGitCredentialPayload>,
  userId: number,
  id: number
) {
  try {
    const { data } = await axios.put(buildGitUrl(userId, id), credential);
    return data;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to update credential');
  }
}

export function useUpdateGitCredentialMutation() {
  const queryClient = useQueryClient();

  return useMutation(
    ({
      credential,
      userId,
      id,
    }: {
      credential: UpdateGitCredentialPayload;
      userId: number;
      id: number;
    }) => updateGitCredential(credential, userId, id),
    {
      onSuccess: (_, data) => {
        notifySuccess(
          'Git credential updated successfully',
          data.credential.name
        );
        return queryClient.invalidateQueries(['gitcredentials']);
      },
      meta: {
        error: {
          title: 'Failure',
          message: 'Unable to update credential',
        },
      },
    }
  );
}

export function useDeleteGitCredentialMutation() {
  const queryClient = useQueryClient();

  return useMutation(deleteGitCredential, {
    onSuccess: (_, credential) => {
      notifySuccess('Git Credential deleted successfully', credential.name);
      return queryClient.invalidateQueries(['gitcredentials']);
    },
    meta: {
      error: {
        title: 'Failure',
        message: 'Unable to delete git credential',
      },
    },
  });
}

export function useGitCredentials(
  userId: UserId,
  { enabled }: { enabled?: boolean } = {}
) {
  return useQuery(['gitcredentials'], () => getGitCredentials(userId), {
    enabled: isBE && enabled,
    meta: {
      error: {
        title: 'Failure',
        message: 'Unable to retrieve git credentials',
      },
    },
  });
}

export function useGitCredential(userId: number, id: number) {
  return useQuery(['gitcredentials', id], () => getGitCredential(userId, id), {
    meta: {
      error: {
        title: 'Failure',
        message: 'Unable to retrieve git credential',
      },
    },
  });
}

export function buildGitUrl(userId: number, credentialId?: number) {
  return credentialId
    ? `/users/${userId}/gitcredentials/${credentialId}`
    : `/users/${userId}/gitcredentials`;
}
