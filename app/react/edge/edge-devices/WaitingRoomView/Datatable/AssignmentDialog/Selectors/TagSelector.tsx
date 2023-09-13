import { notifySuccess } from '@/portainer/services/notifications';
import { useCreateTagMutation, useTags } from '@/portainer/tags/queries';

import { CreatableSelector } from './CreatableSelector';

export function TagSelector() {
  const createMutation = useCreateTagMutation();

  const tagsQuery = useTags({
    select: (tags) => tags.map((opt) => ({ label: opt.Name, value: opt.ID })),
  });

  if (!tagsQuery.data) {
    return null;
  }

  const tags = tagsQuery.data;

  return (
    <CreatableSelector
      name="tags"
      options={tags}
      onCreate={handleCreate}
      isLoading={createMutation.isLoading}
    />
  );

  async function handleCreate(newTag: string) {
    const tag = await createMutation.mutateAsync(newTag);

    notifySuccess('Tag created', `Tag ${tag.Name} created`);

    return tag.ID;
  }
}
