import { useField } from 'formik';

import { useGroups } from '@/portainer/environment-groups/queries';
import { EnvironmentGroupId } from '@/portainer/environment-groups/types';

import { FormControl } from '@@/form-components/FormControl';
import { Select } from '@@/form-components/Input';

export function GroupField() {
  const [fieldProps, metaProps, helpers] =
    useField<EnvironmentGroupId>('meta.groupId');

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
        name="meta.groupId"
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
