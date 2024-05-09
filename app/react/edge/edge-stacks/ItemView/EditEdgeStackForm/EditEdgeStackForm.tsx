import { EdgeStack } from '@/react/edge/edge-stacks/types';

import { GitForm } from './GitForm';
import { NonGitStackForm } from './NonGitStackForm';

export function EditEdgeStackForm({ edgeStack }: { edgeStack: EdgeStack }) {
  if (edgeStack.GitConfig) {
    return <GitForm stack={edgeStack} />;
  }

  return <NonGitStackForm edgeStack={edgeStack} />;
}
