import { useMutation, useQuery, useQueryClient } from 'react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { success as notifySuccess } from '@/portainer/services/notifications';

import {
  CreateHelmRepositoryPayload,
  HelmRepository,
  HelmRepositories,
} from './types';

export async function createHelmRepository(
  helmRepository: CreateHelmRepositoryPayload
) {
  try {
    const { data } = await axios.post<{ helmRepository: HelmRepository }>(
      buildUrl(helmRepository.UserId),
      helmRepository
    );
    return data.helmRepository;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to create helm repository');
  }
}

export async function getHelmRepositories(userId: number) {
  try {
    const { data } = await axios.get<HelmRepositories>(buildUrl(userId));
    return data;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to get helm repositories');
  }
}

export async function deleteHelmRepository(repo: HelmRepository) {
  try {
    await axios.delete<HelmRepository[]>(buildUrl(repo.UserId, repo.Id));
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to delete helm repository');
  }
}

export function useDeleteHelmRepositoryMutation() {
  const queryClient = useQueryClient();

  return useMutation(deleteHelmRepository, {
    onSuccess: (_, helmRepository) => {
      notifySuccess('Helm repository deleted successfully', helmRepository.URL);
      return queryClient.invalidateQueries(['helmrepositories']);
    },
    meta: {
      error: {
        title: 'Failure',
        message: 'Unable to delete helm repository',
      },
    },
  });
}

export function useHelmRepositories(userId: number) {
  return useQuery('helmrepositories', () => getHelmRepositories(userId), {
    staleTime: 20,
    meta: {
      error: {
        title: 'Failure',
        message: 'Unable to retrieve helm repositories',
      },
    },
  });
}

export function useCreateHelmRepositoryMutation() {
  const queryClient = useQueryClient();

  return useMutation(createHelmRepository, {
    onSuccess: (_, payload) => {
      notifySuccess('Credentials created successfully', payload.URL);
      return queryClient.invalidateQueries(['helmrepositories']);
    },
    meta: {
      error: {
        title: 'Failure',
        message: 'Unable to create helm repository',
      },
    },
  });
}

function buildUrl(userId: number, helmRepositoryId?: number) {
  if (helmRepositoryId) {
    return `/users/${userId}/helm/repositories/${helmRepositoryId}`;
  }
  return `/users/${userId}/helm/repositories`;
}
