import clsx from 'clsx';
import { FormikErrors } from 'formik';

import { FormSection } from '@@/form-components/FormSection';
import { InputList } from '@@/form-components/InputList';
import { ItemProps } from '@@/form-components/InputList/InputList';
import { isErrorType } from '@@/form-components/formikUtils';
import { FormError } from '@@/form-components/FormError';
import { InputGroup } from '@@/form-components/InputGroup';
import { Option, PortainerSelect } from '@@/form-components/PortainerSelect';

import { TaintEffect } from '../../types';

import { NodeTaint } from './types';
import { createNewTaint } from './nodeFormUtils';

interface Props {
  taints: NodeTaint[];
  errors: FormikErrors<NodeTaint[]>;
  onChangeTaints: (taints: NodeTaint[]) => void;
  hasNodeWriteAccess: boolean;
}

const taintEffectOptions: Option<TaintEffect>[] = [
  { label: 'NoSchedule', value: 'NoSchedule' },
  { label: 'PreferNoSchedule', value: 'PreferNoSchedule' },
  { label: 'NoExecute', value: 'NoExecute' },
];

export function NodeTaints({
  taints,
  onChangeTaints,
  errors,
  hasNodeWriteAccess,
}: Props) {
  return (
    <FormSection title="Taints">
      <InputList<NodeTaint>
        value={taints}
        onChange={onChangeTaints}
        data-cy="node-taints-input"
        item={NodeTaintItem}
        addLabel="Add taint"
        canUndoDelete
        itemBuilder={createNewTaint}
        errors={errors}
        readOnly={!hasNodeWriteAccess}
      />
    </FormSection>
  );
}

function NodeTaintItem({
  onChange,
  item,
  error,
  disabled,
  readOnly,
  index,
}: ItemProps<NodeTaint>) {
  const formikError = isErrorType(error) ? error : undefined;
  return (
    <div className="flex items-start gap-2 flex-wrap">
      <div className="w-64 flex-none">
        <InputGroup
          size="small"
          className={clsx(item.needsDeletion && 'striked')}
        >
          <InputGroup.Addon>Key</InputGroup.Addon>
          <InputGroup.Input
            placeholder="e.g. foo"
            value={item.key}
            onChange={(e) => handleChange('key', e.target.value)}
            disabled={disabled}
            readOnly={readOnly}
            type="text"
            data-cy={`node-taint-key-input_${index}`}
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
            placeholder="e.g. bar"
            value={item.value}
            onChange={(e) => handleChange('value', e.target.value)}
            disabled={disabled}
            readOnly={readOnly}
            type="text"
            data-cy={`node-taint-value-input_${index}`}
          />
        </InputGroup>
        {!!formikError?.value && <FormError>{formikError.value}</FormError>}
      </div>
      <div className="w-44 flex-none">
        <InputGroup
          size="small"
          className={clsx(item.needsDeletion && 'striked')}
        >
          <InputGroup.Addon>Effect</InputGroup.Addon>
          <PortainerSelect
            value={item.effect}
            onChange={(value) => handleChange('effect', value as TaintEffect)}
            options={taintEffectOptions}
            disabled={disabled || readOnly}
            data-cy={`node-taint-effect-select_${index}`}
            // className={clsx(item.needsDeletion && 'striked')}
            size="sm"
          />
        </InputGroup>
        {!!formikError?.effect && <FormError>{formikError.effect}</FormError>}
      </div>
    </div>
  );

  function handleChange(key: keyof NodeTaint, value: string | TaintEffect) {
    onChange({ ...item, [key]: value, isChanged: true });
  }
}
