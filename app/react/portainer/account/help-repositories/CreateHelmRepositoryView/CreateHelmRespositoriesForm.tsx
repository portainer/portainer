import { useRouter } from '@uirouter/react';

import { useCurrentUser } from '@/react/hooks/useUser';

import { CreateHelmRepositoryPayload } from '../../AccountView/HelmRepositoryDatatable/types';
import {
  useHelmRepositories,
  useCreateHelmRepositoryMutation,
} from '../../AccountView/HelmRepositoryDatatable/helm-repositories.service';
import { HelmRepositoryForm } from '../components/HelmRepositoryForm';

type Props = {
  routeOnSuccess?: string;
};

export function CreateHelmRepositoryForm({ routeOnSuccess }: Props) {
  const router = useRouter();
  const currentUser = useCurrentUser();

  const createHelmRepositoryMutation = useCreateHelmRepositoryMutation();
  const helmReposQuery = useHelmRepositories(currentUser.user.Id);

  return (
    <HelmRepositoryForm
      isLoading={createHelmRepositoryMutation.isLoading}
      onSubmit={onSubmit}
      URLs={helmReposQuery.data?.UserRepositories.map((x) => x.URL) || []}
    />
  );

  function onSubmit(values: CreateHelmRepositoryPayload) {
    const payload: CreateHelmRepositoryPayload = {
      ...values,
      UserId: currentUser.user.Id,
    };
    createHelmRepositoryMutation.mutate(payload, {
      onSuccess: () => {
        if (routeOnSuccess) {
          router.stateService.go(routeOnSuccess);
        }
      },
    });
  }
}
