import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import i18n from '@/i18n';
import { success as notifySuccess } from '@/portainer/services/notifications';
import { withError } from '@/react-tools/react-query';
import { pluralize } from '@/portainer/helpers/strings';
import { queryKeys } from '@/react/kubernetes/helm/helmChartSourceQueries/query-keys';
import { useCurrentUser } from '@/react/hooks/useUser';

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
    throw parseAxiosError(e as Error, i18n.t('helm_repos.create_error'));
  }
}

export async function getHelmRepositories(userId: number) {
  try {
    const { data } = await axios.get<HelmRepositories>(buildUrl(userId));
    return data;
  } catch (e) {
    throw parseAxiosError(e as Error, i18n.t('helm_repos.retrieve_error'));
  }
}

export async function deleteHelmRepository(repo: HelmRepository) {
  try {
    await axios.delete<HelmRepository[]>(buildUrl(repo.UserId, repo.Id));
  } catch (e) {
    throw parseAxiosError(e as Error, i18n.t('helm_repos.delete_error'));
  }
}

export async function deleteHelmRepositories(repos: HelmRepository[]) {
  try {
    await Promise.all(repos.map((repo) => deleteHelmRepository(repo)));
  } catch (e) {
    throw parseAxiosError(e as Error, i18n.t('helm_repos.delete_multi_error'));
  }
}

export function useDeleteHelmRepositoryMutation() {
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();

  return useMutation(deleteHelmRepository, {
    onSuccess: (_, helmRepository) => {
      notifySuccess(i18n.t('helm_repos.delete_success'), helmRepository.URL);
      return queryClient.invalidateQueries(queryKeys.registries(user.Id));
    },
    ...withError(i18n.t('helm_repos.delete_error')),
  });
}

export function useDeleteHelmRepositoriesMutation() {
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();

  return useMutation(deleteHelmRepositories, {
    onSuccess: () => {
      notifySuccess(
        i18n.t('common.success'),
        `Helm ${pluralize(
          deleteHelmRepositories.length,
          'repository',
          'repositories'
        )} deleted successfully`
      );
      return queryClient.invalidateQueries(queryKeys.registries(user.Id));
    },
    ...withError(i18n.t('helm_repos.delete_multi_error')),
  });
}

export function useHelmRepositories(userId: number) {
  return useQuery(
    queryKeys.registries(userId),
    () => getHelmRepositories(userId),
    {
      staleTime: 20,
      ...withError(i18n.t('helm_repos.retrieve_error')),
    }
  );
}

export function useCreateHelmRepositoryMutation() {
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();

  return useMutation(createHelmRepository, {
    onSuccess: (_, payload) => {
      notifySuccess(i18n.t('helm_repos.create_success'), payload.URL);
      return queryClient.invalidateQueries(queryKeys.registries(user.Id));
    },
    ...withError(i18n.t('helm_repos.create_error')),
  });
}

function buildUrl(userId: number, helmRepositoryId?: number) {
  if (helmRepositoryId) {
    return `/users/${userId}/helm/repositories/${helmRepositoryId}`;
  }
  return `/users/${userId}/helm/repositories`;
}
