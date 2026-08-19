import { useIsEdgeAdmin } from '@/react/hooks/useUser';

import { TooltipWithChildren } from '@@/Tip/TooltipWithChildren';

import { EditButton } from './EditButton';

interface Props {
  stackId: number | undefined;
}

export function EdgeEditButton({ stackId }: Props) {
  const edgeAdminQuery = useIsEdgeAdmin();

  const isDisabled =
    edgeAdminQuery.isLoading || !edgeAdminQuery.isAdmin || !stackId;

  const button = (
    <EditButton
      to="edge.stacks.edit"
      params={{ stackId }}
      disabled={isDisabled}
    >
      Manage edge stack
    </EditButton>
  );

  if (edgeAdminQuery.isLoading || edgeAdminQuery.isAdmin || !stackId) {
    return button;
  }

  return (
    <TooltipWithChildren message="This application is managed by an edge stack and can only be edited by an edge administrator">
      <span>{button}</span>
    </TooltipWithChildren>
  );
}
