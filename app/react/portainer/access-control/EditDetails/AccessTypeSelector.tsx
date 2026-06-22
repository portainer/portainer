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
  resourceName = 'resource',
}: {
  name: string;
  isAdmin: boolean;
  teams: Team[];
  isPublicVisible: boolean;
  value: ResourceControlOwnership;
  onChange(value: ResourceControlOwnership): void;
  resourceName?: string;
}) {
  const options = useOptions(isAdmin, teams, isPublicVisible, resourceName);

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
