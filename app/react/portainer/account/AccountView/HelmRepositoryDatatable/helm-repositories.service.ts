import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { success as notifySuccess } from '@/portainer/services/notifications';
import { withError } from '@/react-tools/react-query';
import { pluralize } from '@/portainer/helpers/strings';

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
    throw parseAxiosError(e as Error, 'Unable to create Helm repository');
  }
}

export async function getHelmRepositories(userId: number) {
  try {
    const { data } = await axios.get<HelmRepositories>(buildUrl(userId));
    return data;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to get Helm repositories');
  }
}

export async function deleteHelmRepository(repo: HelmRepository) {
  try {
    await axios.delete<HelmRepository[]>(buildUrl(repo.UserId, repo.Id));
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to delete Helm repository');
  }
}

export async function deleteHelmRepositories(repos: HelmRepository[]) {
  try {
    await Promise.all(repos.map((repo) => deleteHelmRepository(repo)));
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to delete Helm repositories');
  }
}

export function useDeleteHelmRepositoryMutation() {
  const queryClient = useQueryClient();

  return useMutation(deleteHelmRepository, {
    onSuccess: (_, helmRepository) => {
      notifySuccess('Helm repository deleted successfully', helmRepository.URL);
      return queryClient.invalidateQueries(['helmrepositories']);
    },
    ...withError('Unable to delete Helm repository'),
  });
}

export function useDeleteHelmRepositoriesMutation() {
  const queryClient = useQueryClient();

  return useMutation(deleteHelmRepositories, {
    onSuccess: () => {
      notifySuccess(
        'Success',
        `Helm ${pluralize(
          deleteHelmRepositories.length,
          'repository',
          'repositories'
        )} deleted successfully`
      );
      return queryClient.invalidateQueries(['helmrepositories']);
    },
    ...withError('Unable to delete Helm repositories'),
  });
}

export function useHelmRepositories(userId: number) {
  return useQuery(['helmrepositories'], () => getHelmRepositories(userId), {
    staleTime: 20,
    ...withError('Unable to retrieve Helm repositories'),
  });
}

export function useCreateHelmRepositoryMutation() {
  const queryClient = useQueryClient();

  return useMutation(createHelmRepository, {
    onSuccess: (_, payload) => {
      notifySuccess('Helm repository created successfully', payload.URL);
      return queryClient.invalidateQueries(['helmrepositories']);
    },
    ...withError('Unable to create Helm repository'),
  });
}

function buildUrl(userId: number, helmRepositoryId?: number) {
  if (helmRepositoryId) {
    return `/users/${userId}/helm/repositories/${helmRepositoryId}`;
  }
  return `/users/${userId}/helm/repositories`;
}
