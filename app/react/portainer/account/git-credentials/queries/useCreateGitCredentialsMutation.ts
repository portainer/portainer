import { useQueryClient, useMutation } from 'react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { notifyError, notifySuccess } from '@/portainer/services/notifications';
import { GitAuthModel } from '@/react/portainer/gitops/types';
import { useCurrentUser } from '@/react/hooks/useUser';

import { GitCredential } from '../types';
import { buildGitUrl } from '../git-credentials.service';

export interface CreateGitCredentialPayload {
  userId: number;
  name: string;
  username?: string;
  password: string;
}

export function useCreateGitCredentialMutation() {
  const queryClient = useQueryClient();

  return useMutation(createGitCredential, {
    onSuccess: (_, payload) => {
      notifySuccess('Credentials created successfully', payload.name);
      return queryClient.invalidateQueries(['gitcredentials']);
    },
    meta: {
      error: {
        title: 'Failure',
        message: 'Unable to create credential',
      },
    },
  });
}

async function createGitCredential(gitCredential: CreateGitCredentialPayload) {
  try {
    const { data } = await axios.post<{ gitCredential: GitCredential }>(
      buildGitUrl(gitCredential.userId),
      gitCredential
    );
    return data.gitCredential;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to create git credential');
  }
}

export function useSaveCredentialsIfRequired() {
  const saveCredentialsMutation = useCreateGitCredentialMutation();
  const { user } = useCurrentUser();

  return {
    saveCredentials: saveCredentialsIfRequired,
    isLoading: saveCredentialsMutation.isLoading,
  };

  async function saveCredentialsIfRequired(authentication?: GitAuthModel) {
    if (!authentication) {
      return undefined;
    }

    if (
      !authentication.SaveCredential ||
      !authentication.RepositoryPassword ||
      !authentication.NewCredentialName
    ) {
      return authentication.RepositoryGitCredentialID;
    }

    try {
      const credential = await saveCredentialsMutation.mutateAsync({
        userId: user.Id,
        username: authentication.RepositoryUsername,
        password: authentication.RepositoryPassword,
        name: authentication.NewCredentialName,
      });
      return credential.id;
    } catch (err) {
      notifyError('Error', err as Error, 'Unable to save credentials');
      return undefined;
    }
  }
}
