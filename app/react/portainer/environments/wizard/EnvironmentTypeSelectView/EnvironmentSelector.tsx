import { BoxSelector } from '@@/BoxSelector';
import { FormSection } from '@@/form-components/FormSection';

import { environmentTypes } from './environment-types';

export type EnvironmentSelectorValue = typeof environmentTypes[number]['id'];

interface Props {
  value: EnvironmentSelectorValue[];
  onChange(value: EnvironmentSelectorValue[]): void;
  createEdgeDevice?: boolean;
}

const hasEdge: EnvironmentSelectorValue[] = [
  'dockerStandalone',
  'dockerSwarm',
  'kubernetes',
];

export function EnvironmentSelector({
  value,
  onChange,
  createEdgeDevice,
}: Props) {
  const options = filterEdgeDevicesIfNeed(environmentTypes, createEdgeDevice);

  return (
    <div className="form-horizontal">
      <FormSection title="Select your environment(s)">
        <p className="text-muted small">
          You can onboard different types of environments, select all that
          apply.
        </p>

        <BoxSelector
          options={options}
          isMulti
          value={value}
          onChange={onChange}
          radioName="type-selector"
        />
      </FormSection>
    </div>
  );
}

function filterEdgeDevicesIfNeed(
  types: typeof environmentTypes,
  createEdgeDevice?: boolean
) {
  if (!createEdgeDevice) {
    return [...types];
  }

  return [...types.filter((eType) => hasEdge.includes(eType.id))];
}
