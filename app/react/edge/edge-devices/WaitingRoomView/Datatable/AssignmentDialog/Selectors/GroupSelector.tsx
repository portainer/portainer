import { useField } from 'formik';

import { useGroups } from '@/react/portainer/environments/environment-groups/queries';
import { EnvironmentGroupId } from '@/react/portainer/environments/types';
import { useCreateGroupMutation } from '@/react/portainer/environments/environment-groups/queries/useCreateGroupMutation';
import { notifySuccess } from '@/portainer/services/notifications';

import { Select } from '@@/form-components/ReactSelect';

import { FormValues } from '../types';

export function GroupSelector() {
  const [{ value, onBlur }, , { setValue }] =
    useField<FormValues['group']>('group');
  const createMutation = useCreateGroupMutation();

  const groupsQuery = useGroups({
    select: (groups) =>
      groups
        .filter((g) => g.Id !== 1)
        .map((opt) => ({ label: opt.Name, value: opt.Id })),
  });

  if (!groupsQuery.data) {
    return null;
  }

  const options = groupsQuery.data;
  const selectedValue = value ? options.find((g) => g.value === value) : null;

  return (
    <Select
      isCreatable
      options={options}
      value={
        createMutation.isLoading
          ? { label: 'Creating...', value: 0 }
          : selectedValue
      }
      onCreateOption={handleCreate}
      onChange={handleChange}
      onBlur={onBlur}
      isLoading={createMutation.isLoading}
      isDisabled={createMutation.isLoading}
      placeholder="Select a group"
      isClearable
      data-cy="edge-devices-assignment-selector"
      id="edge-devices-assignment-selector"
    />
  );

  function handleCreate(newGroup: string) {
    createMutation.mutate(
      { name: newGroup },
      {
        onSuccess: (data) => {
          setValue(data.Id);
          notifySuccess('Group created', `Group ${data.Name} created`);
        },
      }
    );
  }

  function handleChange(value: { value: EnvironmentGroupId } | null) {
    setValue(value ? value.value : 1);
  }
}
