import _ from 'lodash';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { EdgeGroup } from '@/react/edge/edge-groups/types';

import { Select } from '@@/form-components/ReactSelect';
import { FormError } from '@@/form-components/FormError';
import { Link } from '@@/Link';
import { FormControl } from '@@/form-components/FormControl';
import { FormSection } from '@@/form-components/FormSection';

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
  const { t } = useTranslation();
  const [inputId] = useState(() => _.uniqueId('edge-groups-selector-'));

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
      label={t('edge_groups.edge_groups_label')}
      required={required}
      inputId={inputId}
    >
      {selector}
    </FormControl>
  ) : (
    <FormSection title={`${t('edge_groups.edge_groups_label')}${required ? ' *' : ''}`} htmlFor={inputId}>
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
  inputId,
}: {
  isGroupVisible(group: EdgeGroup): boolean;
  value: SingleValue[];
  onChange: (value: SingleValue[]) => void;
  inputId: string;
}) {
  const { t } = useTranslation();
  const edgeGroupsQuery = useEdgeGroups();

  const items = (edgeGroupsQuery.data || []).filter(isGroupVisible);

  const valueGroups = _.compact(
    value.map((id) => items.find((item) => item.Id === id))
  );

  return items.length ? (
    <Select
      aria-label={t('edge_groups.edge_groups_label')}
      options={items}
      isMulti
      getOptionLabel={(item) => item.Name}
      getOptionValue={(item) => String(item.Id)}
      value={valueGroups}
      onChange={(value) => {
        onChange(value.map((item) => item.Id));
      }}
      placeholder={t('edge_groups.selector_placeholder')}
      closeMenuOnSelect={false}
      data-cy="edge-stacks-groups-selector"
      id="edge-stacks-groups-selector"
      inputId={inputId}
    />
  ) : (
    <div className="small text-muted">
      {t('edge_groups.no_groups_available')}{' '}
      <Link to="edge.groups" data-cy="edge-stacks-groups-view-link">
        {t('edge_groups.edge_groups_view_link')}
      </Link>{' '}
      {t('edge_groups.to_create_one')}
    </div>
  );
}
