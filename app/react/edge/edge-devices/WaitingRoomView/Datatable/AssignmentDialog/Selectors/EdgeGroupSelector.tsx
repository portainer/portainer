import { notifySuccess } from '@/portainer/services/notifications';
import { useCreateEdgeGroupMutation } from '@/react/edge/edge-groups/queries/useCreateEdgeGroupMutation';
import { useEdgeGroups } from '@/react/edge/edge-groups/queries/useEdgeGroups';

import { CreatableSelector } from './CreatableSelector';

export function EdgeGroupsSelector() {
  const createMutation = useCreateEdgeGroupMutation();

  const edgeGroupsQuery = useEdgeGroups({
    select: (edgeGroups) =>
      edgeGroups
        .filter((g) => !g.Dynamic)
        .map((opt) => ({ label: opt.Name, value: opt.Id })),
  });

  if (!edgeGroupsQuery.data) {
    return null;
  }

  const edgeGroups = edgeGroupsQuery.data;

  return (
    <CreatableSelector
      name="edgeGroups"
      options={edgeGroups}
      onCreate={handleCreate}
      isLoading={createMutation.isLoading}
    />
  );

  async function handleCreate(newGroup: string) {
    const group = await createMutation.mutateAsync({
      name: newGroup,
      dynamic: false,
    });

    notifySuccess('Edge group created', `Group ${group.Name} created`);
    return group.Id;
  }
}
