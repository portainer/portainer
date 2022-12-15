import { FormikErrors, FormikHandlers } from 'formik';

import { useEdgeGroups } from '@/react/edge/edge-groups/queries/useEdgeGroups';

import { FormControl } from '@@/form-components/FormControl';
import { Select } from '@@/form-components/ReactSelect';

import { FormValues } from './types';

interface Props {
  disabled?: boolean;
  onBlur: FormikHandlers['handleBlur'];
  value: FormValues['groupIds'];
  error?: FormikErrors<FormValues>['groupIds'];
  onChange(value: FormValues['groupIds']): void;
}

export function EdgeGroupsField({
  disabled,
  onBlur,
  value,
  error,
  onChange,
}: Props) {
  const groupsQuery = useEdgeGroups();

  const selectedGroups = groupsQuery.data?.filter((group) =>
    value.includes(group.Id)
  );

  return (
    <FormControl label="Groups" required inputId="groups-select" errors={error}>
      <Select
        name="groupIds"
        onBlur={onBlur}
        value={selectedGroups}
        inputId="groups-select"
        placeholder="Select one or multiple group(s)"
        onChange={(selectedGroups) => onChange(selectedGroups.map((g) => g.Id))}
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
