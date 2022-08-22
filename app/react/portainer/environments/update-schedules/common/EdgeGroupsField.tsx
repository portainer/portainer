import { useField } from 'formik';

import { useEdgeGroups } from '@/react/edge/edge-groups/queries/useEdgeGroups';

import { FormControl } from '@@/form-components/FormControl';
import { Select } from '@@/form-components/ReactSelect';

import { FormValues } from './types';

interface Props {
  disabled?: boolean;
}

export function EdgeGroupsField({ disabled }: Props) {
  const groupsQuery = useEdgeGroups();

  const [{ name, onBlur, value }, { error }, { setValue }] =
    useField<FormValues['groupIds']>('groupIds');

  const selectedGroups = groupsQuery.data?.filter((group) =>
    value.includes(group.Id)
  );

  return (
    <FormControl label="Groups" required inputId="groups-select" errors={error}>
      <Select
        name={name}
        onBlur={onBlur}
        value={selectedGroups}
        inputId="groups-select"
        placeholder="Select one or multiple group(s)"
        onChange={(selectedGroups) => setValue(selectedGroups.map((g) => g.Id))}
        isMulti
        options={groupsQuery.data || []}
        getOptionLabel={(group) => group.Name}
        getOptionValue={(group) => group.Id.toString()}
        closeMenuOnSelect={false}
        isDisabled={disabled}
      />
    </FormControl>
  );
}
