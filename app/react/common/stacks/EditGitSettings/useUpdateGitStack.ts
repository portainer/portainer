import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Stack } from '@/react/common/stacks/types';
import { updateGitStack } from '@/react/portainer/gitops/queries/useUpdateGitStack';
import { updateGitStackSettings } from '@/react/portainer/gitops/queries/useUpdateGitStackSettings';
import { queryKeys } from '@/react/common/stacks/queries/query-keys';
import { transformAutoUpdateViewModel } from '@/react/portainer/gitops/AutoUpdateFieldset/utils';
import { saveGitCredentialsIfNeeded } from '@/react/portainer/account/git-credentials/queries/useCreateGitCredentialsMutation';
import { useCurrentUser } from '@/react/hooks/useUser';
import { withError } from '@/react-tools/react-query';

import { FormValues } from './types';

interface MutationArgs {
  values: FormValues;
  repullImageAndRedeploy?: boolean;
  webhookId: string;
}

export function useUpdateGitStack(stack: Stack) {
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();
  return useMutation({
    mutationFn: async ({
      values,
      repullImageAndRedeploy,
      webhookId,
    }: MutationArgs) => {
      const resolvedAuth = await saveGitCredentialsIfNeeded(
        user.Id,
        values.git
      );

      const autoUpdate = transformAutoUpdateViewModel(
        values.git.AutoUpdate,
        webhookId
      );

      await updateGitStackSettings(stack.Id, stack.EndpointId, {
        RepositoryURL: values.git.RepositoryURL,
        ConfigFilePath: values.git.ComposeFilePathInRepository,
        RepositoryReferenceName: values.git.RepositoryReferenceName,
        RepositoryAuthentication: resolvedAuth.RepositoryAuthentication,
        RepositoryGitCredentialID: resolvedAuth.RepositoryGitCredentialID,
        RepositoryUsername: resolvedAuth.RepositoryUsername,
        RepositoryPassword: resolvedAuth.RepositoryPassword || undefined,
        RepositoryAuthorizationType: resolvedAuth.RepositoryAuthorizationType,
        TLSSkipVerify: values.git.TLSSkipVerify,
        AutoUpdate: autoUpdate,
        AdditionalFiles: values.git.AdditionalFiles,
        env: values.env,
        prune: values.prune,
      });

      if (repullImageAndRedeploy === undefined) {
        return { redeployAttempted: false, redeployFailed: false };
      }

      try {
        await updateGitStack(stack.Id, stack.EndpointId, {
          Env: values.env,
          Prune: values.prune,
          StackName: values.kube.name.trim() || undefined,
          RepositoryAuthentication: resolvedAuth.RepositoryAuthentication,
          RepositoryGitCredentialID: resolvedAuth.RepositoryGitCredentialID,
          RepositoryUsername: resolvedAuth.RepositoryUsername,
          RepositoryPassword: resolvedAuth.RepositoryPassword || undefined,
          RepositoryAuthorizationType: resolvedAuth.RepositoryAuthorizationType,
          RepullImageAndRedeploy: repullImageAndRedeploy,
        });
        return { redeployAttempted: true, redeployFailed: false };
      } catch (error) {
        return {
          redeployAttempted: true,
          redeployFailed: true,
          redeployError: error,
        };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.stack(stack.Id),
      });
    },
    ...withError('Unable to save stack settings'),
  });
}
