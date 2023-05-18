import _ from 'lodash';

import { EdgeGroup } from '@/react/edge/edge-groups/types';

import { Select } from '@@/form-components/ReactSelect';
import { FormSection } from '@@/form-components/FormSection';
import { FormError } from '@@/form-components/FormError';
import { Link } from '@@/Link';
import { FormControl } from '@@/form-components/FormControl';

import { useEdgeGroups } from '../../edge-groups/queries/useEdgeGroups';

type SingleValue = EdgeGroup['Id'];

interface Props {
  value: SingleValue[];
  onChange: (value: SingleValue[]) => void;
  error?: string | string[];
  horizontal?: boolean;
  isGroupVisible?(group: EdgeGroup): boolean;
}

export function EdgeGroupsSelector({
  value,
  onChange,
  error,
  horizontal,
  isGroupVisible = () => true,
}: Props) {
  const selector = (
    <InnerSelector
      value={value}
      onChange={onChange}
      isGroupVisible={isGroupVisible}
    />
  );

  return horizontal ? (
    <FormControl errors={error} label="Edge Groups">
      {selector}
    </FormControl>
  ) : (
    <FormSection title="Edge Groups">
      <div className="form-group">
        <div className="col-sm-12">{selector} </div>
        {error && (
          <div className="col-sm-12">
            <FormError>{error}</FormError>
          </div>
        )}
      </div>
    </FormSection>
  );
}

function InnerSelector({
  value,
  onChange,
  isGroupVisible,
}: {
  isGroupVisible(group: EdgeGroup): boolean;
  value: SingleValue[];
  onChange: (value: SingleValue[]) => void;
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
    />
  ) : (
    <div className="small text-muted">
      No Edge groups are available. Head over to the{' '}
      <Link to="edge.groups">Edge groups view</Link> to create one.
    </div>
  );
}
