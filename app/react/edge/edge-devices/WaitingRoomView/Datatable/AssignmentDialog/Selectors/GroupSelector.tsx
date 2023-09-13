import { useCallback, useState } from 'react';
import { useField } from 'formik';

import { useGroups } from '@/react/portainer/environments/environment-groups/queries';
import { EnvironmentGroupId } from '@/react/portainer/environments/environment-groups/types';
import { useCreateGroupMutation } from '@/react/portainer/environments/environment-groups/queries/useCreateGroupMutation';
import { notifySuccess } from '@/portainer/services/notifications';

import { Select } from '@@/form-components/ReactSelect';
import { Option } from '@@/form-components/PortainerSelect';

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

  const { onInputChange, clearInputValue } = useCreateOnBlur({
    options: groupsQuery.data || [],
    setValue,
    createValue: handleCreate,
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
      onInputChange={onInputChange}
      onBlur={onBlur}
      isLoading={createMutation.isLoading}
      isDisabled={createMutation.isLoading}
      placeholder="Select a group"
      isClearable
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
    clearInputValue();
  }
}

function useCreateOnBlur({
  options,
  setValue,
  createValue,
}: {
  options: Option<number>[];
  setValue: (value: number) => void;
  createValue: (value: string) => void;
}) {
  const [inputValue, setInputValue] = useState('');

  const handleBlur = useCallback(() => {
    const label = inputValue?.trim() || '';
    if (!label) {
      return;
    }

    const option = options.find((opt) => opt.label === label);
    if (option) {
      setValue(option.value);
    } else {
      createValue(label);
    }
    setInputValue('');
  }, [createValue, inputValue, options, setValue]);

  const handleInputChange = useCallback(
    (inputValue, { action }) => {
      if (action === 'input-change') {
        setInputValue(inputValue);
      }
      if (action === 'input-blur') {
        handleBlur();
      }
    },
    [handleBlur]
  );

  const clearInputValue = useCallback(() => {
    setInputValue('');
  }, []);

  return {
    onInputChange: handleInputChange,
    clearInputValue,
  };
}
