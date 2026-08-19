import { useMemo } from 'react';
import _ from 'lodash';

import {
  engine,
  ip,
  role,
  name,
  status,
} from '@/react/docker/swarm/SwarmView/NodesDatatable/columns';

export function useColumns(isIpColumnVisible: boolean) {
  return useMemo(
    () => _.compact([name, role, engine, isIpColumnVisible && ip, status]),
    [isIpColumnVisible]
  );
}
