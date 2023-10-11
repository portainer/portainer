import { useRouter } from '@uirouter/react';

import { useCurrentUser } from '@/react/hooks/useUser';

import {
  CreateHelmRepositoryPayload,
  HelmRepositoryFormValues,
} from '../../AccountView/HelmRepositoryDatatable/types';
import {
  useHelmRepositories,
  useCreateHelmRepositoryMutation,
} from '../../AccountView/HelmRepositoryDatatable/helm-repositories.service';
import { HelmRepositoryForm } from '../components/HelmRepositoryForm';

export function CreateHelmRepositoryForm() {
  const router = useRouter();
  const currentUser = useCurrentUser();

  const createHelmRepositoryMutation = useCreateHelmRepositoryMutation();
  const helmReposQuery = useHelmRepositories(currentUser.user.Id);

  const allRepositories =
    helmReposQuery.data?.UserRepositories.map((x) => x.URL) || [];
  if (helmReposQuery.data?.GlobalRepository) {
    allRepositories.push(helmReposQuery.data?.GlobalRepository);
  }

  return (
    <HelmRepositoryForm
      isLoading={createHelmRepositoryMutation.isLoading}
      onSubmit={onSubmit}
      URLs={allRepositories}
    />
  );

  function onSubmit(values: HelmRepositoryFormValues) {
    const payload: CreateHelmRepositoryPayload = {
      ...values,
      UserId: currentUser.user.Id,
    };
    createHelmRepositoryMutation.mutate(payload, {
      onSuccess: () => {
        router.stateService.go('portainer.account');
      },
    });
  }
}
