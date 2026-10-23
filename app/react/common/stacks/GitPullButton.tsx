import { capitalize } from 'lodash';
import { GitMerge } from 'lucide-react';
import { useRouter } from '@uirouter/react';

import { Stack, StackType } from '@/react/common/stacks/types';
import { Authorized } from '@/react/hooks/useUser';
import { useUpdateGitStack } from '@/react/portainer/gitops/queries/useUpdateGitStack';
import { notifyError, notifySuccess } from '@/portainer/services/notifications';
import { confirmStackUpdate } from '@/react/common/stacks/common/confirm-stack-update';

import { Button } from '@@/buttons';
import { Icon } from '@@/Icon';

export function GitPullButton({ stack }: { stack: Stack }) {
  const router = useRouter();
  const mutation = useUpdateGitStack(stack.Id, stack.EndpointId);

  return (
    <Authorized authorizations="PortainerStackUpdate">
      <Button
        type="button"
        size="small"
        color="light"
        className="!ml-0"
        disabled={mutation.isLoading}
        onClick={handleClick}
        data-cy="git-pull-button"
      >
        <Icon icon={GitMerge} className="mr-1" />
        Pull and redeploy
      </Button>
    </Authorized>
  );

  async function handleClick() {
    const stackLabel =
      stack.Type === StackType.Kubernetes ? 'application' : 'stack';
    const result = await confirmStackUpdate(
      `Pulling from git will override any local changes to this ${stackLabel} and may cause a service interruption. Do you wish to continue?`,
      false
    );
    if (!result) {
      return;
    }

    mutation.mutate(
      {
        RepullImageAndRedeploy: result.repullImageAndRedeploy,
        Env: stack.Env || [],
        Prune: stack.Option?.Prune,
      },
      {
        onSuccess: () => {
          notifySuccess(
            'Success',
            `${capitalize(stackLabel)} successfully pulled and redeployed`
          );
          router.stateService.reload();
        },
        onError: (err) => {
          notifyError('Failure', err, 'Unable to pull and redeploy');
        },
      }
    );
  }
}
