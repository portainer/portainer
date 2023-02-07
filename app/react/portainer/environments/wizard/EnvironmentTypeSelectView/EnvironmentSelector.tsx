import { BoxSelector } from '@@/BoxSelector';

import { EnvironmentOption, EnvironmentOptionValue } from './environment-types';

interface Props {
  value: EnvironmentOptionValue[];
  onChange(value: EnvironmentOptionValue[]): void;
  options: EnvironmentOption[];
  createEdgeDevice?: boolean;
}

const hasEdge: EnvironmentOptionValue[] = [
  'dockerStandalone',
  'dockerSwarm',
  'kubernetes',
];

export function EnvironmentSelector({
  value,
  onChange,
  createEdgeDevice,
  options,
}: Props) {
  const filteredOptions = filterEdgeDevicesIfNeed(options, createEdgeDevice);

  return (
    <BoxSelector
      options={filteredOptions}
      isMulti
      value={value}
      onChange={onChange}
      radioName="type-selector"
    />
  );
}

function filterEdgeDevicesIfNeed(
  types: EnvironmentOption[],
  createEdgeDevice?: boolean
) {
  if (!createEdgeDevice) {
    return [...types];
  }

  return [...types.filter((eType) => hasEdge.includes(eType.id))];
}
