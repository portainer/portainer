import { useField } from 'formik';

import { useGroups } from '@/react/portainer/environments/environment-groups/queries';
import { EnvironmentGroupId } from '@/react/portainer/environments/types';

import { FormControl } from '@@/form-components/FormControl';
import { Select } from '@@/form-components/Input';

export function GroupField({ name = 'meta.groupId' }: { name?: string }) {
  const [fieldProps, metaProps, helpers] = useField<EnvironmentGroupId>(name);

  const groupsQuery = useGroups();
  if (!groupsQuery.data) {
    return null;
  }

  const options = groupsQuery.data.map((group) => ({
    value: group.Id,
    label: group.Name,
  }));

  return (
    <FormControl label="Group" errors={metaProps.error}>
      <Select
        name={name}
        data-cy="environment-group-select"
        options={options}
        value={fieldProps.value}
        onChange={(e) => handleChange(e.target.value)}
      />
    </FormControl>
  );

  function handleChange(value: string) {
    helpers.setValue(value ? parseInt(value, 10) : 1);
  }
}
