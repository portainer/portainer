import clsx from 'clsx';

import { ItemProps } from '@@/form-components/InputList';
import { Select } from '@@/form-components/ReactSelect';
import { isErrorType } from '@@/form-components/formikUtils';
import { FormError } from '@@/form-components/FormError';

import { NodeLabels, Placement } from './types';

interface PlacementItemProps extends ItemProps<Placement> {
  nodesLabels: NodeLabels;
  availableNodeLabels: NodeLabels;
}

export function PlacementItem({
  onChange,
  item,
  error,
  index,
  nodesLabels,
  availableNodeLabels,
}: PlacementItemProps) {
  const labelOptions = Object.keys(availableNodeLabels).map((label) => ({
    label,
    value: label,
  }));
  const valueOptions = nodesLabels[item.label]?.map((value) => ({
    label: value,
    value,
  }));
  const placementError = isErrorType(error) ? error : undefined;
  return (
    <div className="w-full">
      <div className="flex w-full gap-2">
        <div className="grow basis-1/2">
          <Select
            options={labelOptions}
            value={{ label: item.label, value: item.label }}
            noOptionsMessage={() => 'No available node labels.'}
            onChange={(labelOption) => {
              const newValues = nodesLabels[labelOption?.value || ''];
              onChange({
                ...item,
                value: newValues?.[0] || '',
                label: labelOption?.value || '',
              });
            }}
            size="sm"
            className={clsx({ striked: !!item.needsDeletion })}
            isDisabled={!!item.needsDeletion}
            data-cy={`k8sAppCreate-placementLabel_${index}`}
            id={`k8sAppCreate-placementLabel_${index}`}
          />
          {placementError?.label && (
            <FormError>{placementError.label}</FormError>
          )}
        </div>
        <div className="grow basis-1/2">
          <Select
            options={valueOptions}
            value={valueOptions?.find((option) => option.value === item.value)}
            onChange={(valueOption) =>
              onChange({ ...item, value: valueOption?.value || '' })
            }
            size="sm"
            className={clsx({ striked: !!item.needsDeletion })}
            isDisabled={!!item.needsDeletion}
            data-cy={`k8sAppCreate-placementName_${index}`}
            id={`k8sAppCreate-placementName_${index}`}
          />
          {placementError?.value && (
            <FormError>{placementError.value}</FormError>
          )}
        </div>
      </div>
    </div>
  );
}
