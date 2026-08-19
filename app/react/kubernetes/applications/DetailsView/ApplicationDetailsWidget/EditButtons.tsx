import { Stack } from '@/react/common/stacks/types';
import { Authorized } from '@/react/hooks/useUser';
import { EditGitSettingsButton } from '@/react/common/stacks/EditGitSettingsButton';
import { GitPullButton } from '@/react/common/stacks/GitPullButton';

import { EdgeEditButton } from './EdgeEditButton';
import { EditButton } from './EditButton';

type Props = {
  isEdge?: boolean;
  stackId?: number;
  externalApp?: boolean;
  stack?: Stack;
};

export function EditButtons({ isEdge, stackId, externalApp, stack }: Props) {
  if (isEdge) {
    return (
      <Authorized authorizations="K8sApplicationDetailsW">
        <EdgeEditButton stackId={stackId} />
      </Authorized>
    );
  }

  if (stack?.GitConfig) {
    return (
      <>
        {!stack.FromAppTemplate && <EditGitSettingsButton stack={stack} />}
        <GitPullButton stack={stack} />
      </>
    );
  }

  return (
    <Authorized authorizations="K8sApplicationDetailsW">
      <EditButton to=".edit">
        {externalApp ? 'Edit external application' : 'Edit this application'}
      </EditButton>
    </Authorized>
  );
}
