import { BoxSelector } from '@@/BoxSelector';

import { EnvironmentOption, EnvironmentOptionValue } from './environment-types';

interface Props {
  value: EnvironmentOptionValue[];
  onChange(value: EnvironmentOptionValue[]): void;
  options: EnvironmentOption[];
  hiddenSpacingCount?: number;
}

export function EnvironmentSelector({
  value,
  onChange,
  options,
  hiddenSpacingCount,
}: Props) {
  return (
    <BoxSelector
      options={options}
      isMulti
      value={value}
      onChange={onChange}
      radioName="type-selector"
      hiddenSpacingCount={hiddenSpacingCount}
    />
  );
}
