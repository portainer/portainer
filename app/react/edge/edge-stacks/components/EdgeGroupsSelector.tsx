import _ from 'lodash';

import { EdgeGroup } from '@/react/edge/edge-groups/types';

import { Select } from '@@/form-components/ReactSelect';
import { FormError } from '@@/form-components/FormError';
import { Link } from '@@/Link';
import { FormControl } from '@@/form-components/FormControl';
import { FormSectionTitle } from '@@/form-components/FormSectionTitle';

import { useEdgeGroups } from '../../edge-groups/queries/useEdgeGroups';

type SingleValue = EdgeGroup['Id'];

interface Props {
  value: SingleValue[];
  onChange: (value: SingleValue[]) => void;
  error?: string | string[];
  horizontal?: boolean;
  isGroupVisible?(group: EdgeGroup): boolean;
  required?: boolean;
}

export function EdgeGroupsSelector({
  value,
  onChange,
  error,
  horizontal,
  isGroupVisible = () => true,
  required,
}: Props) {
  const inputId = 'edge-groups-selector';
  const selector = (
    <InnerSelector
      value={value}
      onChange={onChange}
      isGroupVisible={isGroupVisible}
      inputId={inputId}
    />
  );

  return horizontal ? (
    <FormControl
      errors={error}
      label="Edge Groups"
      required={required}
      inputId={inputId}
    >
      {selector}
    </FormControl>
  ) : (
    <>
      <FormSectionTitle htmlFor={inputId}>{`Edge Groups${
        required ? ' *' : ''
      }`}</FormSectionTitle>
      <div className="form-group">
        <div className="col-sm-12">{selector} </div>
        {error && (
          <div className="col-sm-12">
            <FormError>{error}</FormError>
          </div>
        )}
      </div>
    </>
  );
}

function InnerSelector({
  value,
  onChange,
  isGroupVisible,
  inputId,
}: {
  isGroupVisible(group: EdgeGroup): boolean;
  value: SingleValue[];
  onChange: (value: SingleValue[]) => void;
  inputId: string;
}) {
  const edgeGroupsQuery = useEdgeGroups();

  const items = (edgeGroupsQuery.data || []).filter(isGroupVisible);

  const valueGroups = _.compact(
    value.map((id) => items.find((item) => item.Id === id))
  );

  return items.length ? (
    <Select
      aria-label="Edge groups"
      options={items}
      isMulti
      getOptionLabel={(item) => item.Name}
      getOptionValue={(item) => String(item.Id)}
      value={valueGroups}
      onChange={(value) => {
        onChange(value.map((item) => item.Id));
      }}
      placeholder="Select one or multiple group(s)"
      closeMenuOnSelect={false}
      data-cy="edge-stacks-groups-selector"
      inputId={inputId}
    />
  ) : (
    <div className="small text-muted">
      No Edge groups are available. Head over to the{' '}
      <Link to="edge.groups" data-cy="edge-stacks-groups-view-link">
        Edge groups view
      </Link>{' '}
      to create one.
    </div>
  );
}
