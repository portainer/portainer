import { BoxSelector } from '@@/BoxSelector';

import { Team } from '../../users/teams/types';
import { ResourceControlOwnership } from '../types';

import { useOptions } from './useOptions';

export function AccessTypeSelector({
  name,
  isAdmin,
  isPublicVisible,
  teams,
  value,
  onChange,
}: {
  name: string;
  isAdmin: boolean;
  teams: Team[];
  isPublicVisible: boolean;
  value: ResourceControlOwnership;
  onChange(value: ResourceControlOwnership): void;
}) {
  const options = useOptions(isAdmin, teams, isPublicVisible);

  return (
    <BoxSelector
      slim
      radioName={name}
      value={value}
      options={options}
      onChange={onChange}
    />
  );
}
