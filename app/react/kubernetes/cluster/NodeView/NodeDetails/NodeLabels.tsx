import clsx from 'clsx';
import { FormikErrors } from 'formik';

import { FormSection } from '@@/form-components/FormSection';
import { InputList } from '@@/form-components/InputList';
import { ItemProps } from '@@/form-components/InputList/InputList';
import { isErrorType } from '@@/form-components/formikUtils';
import { FormError } from '@@/form-components/FormError';
import { InputGroup } from '@@/form-components/InputGroup';
import { Badge } from '@@/Badge';

import { NodeLabel } from './types';
import { createNewLabel } from './nodeFormUtils';

interface Props {
  labels: NodeLabel[];
  errors: FormikErrors<NodeLabel[]>;
  onChangeLabels: (labels: NodeLabel[]) => void;
  hasNodeWriteAccess: boolean;
}

export function NodeLabels({
  labels,
  onChangeLabels,
  errors,
  hasNodeWriteAccess,
}: Props) {
  return (
    <FormSection title="Labels">
      <InputList<NodeLabel>
        value={labels}
        onChange={onChangeLabels}
        data-cy="node-labels-input"
        item={NodeLabelItem}
        addLabel="Add label"
        canUndoDelete
        itemBuilder={createNewLabel}
        errors={errors}
        readOnly={!hasNodeWriteAccess}
      />
    </FormSection>
  );
}

function NodeLabelItem({
  onChange,
  item,
  error,
  disabled,
  readOnly,
  index,
}: ItemProps<NodeLabel>) {
  const formikError = isErrorType(error) ? error : undefined;
  return (
    <div className="flex items-start gap-2 flex-wrap">
      <div className="w-64 flex-none">
        <InputGroup
          size="small"
          className={clsx(item.needsDeletion && 'striked')}
        >
          <InputGroup.Addon>Name</InputGroup.Addon>
          <InputGroup.Input
            placeholder="e.g. foo.bar"
            value={item.key}
            onChange={(e) => handleChange('key', e.target.value)}
            disabled={disabled || item.isSystem}
            readOnly={readOnly}
            type="text"
            data-cy={`node-label-key-input_${index}`}
          />
        </InputGroup>
        {!!formikError?.key && <FormError>{formikError.key}</FormError>}
      </div>
      <div className="w-64 flex-none">
        <InputGroup
          size="small"
          className={clsx(item.needsDeletion && 'striked')}
        >
          <InputGroup.Addon>Value</InputGroup.Addon>
          <InputGroup.Input
            placeholder="e.g. true"
            value={item.value}
            onChange={(e) => handleChange('value', e.target.value)}
            disabled={disabled || item.isSystem}
            readOnly={readOnly}
            type="text"
            data-cy={`node-label-value-input_${index}`}
          />
        </InputGroup>
        {!!formikError?.value && <FormError>{formikError.value}</FormError>}
      </div>
      {item.isSystem && (
        <div className="flex-none flex items-center">
          <Badge type="info" className="my-auto">
            System
          </Badge>
        </div>
      )}
    </div>
  );

  function handleChange(key: keyof NodeLabel, value: string | number) {
    onChange({ ...item, [key]: value, isChanged: true });
  }
}
