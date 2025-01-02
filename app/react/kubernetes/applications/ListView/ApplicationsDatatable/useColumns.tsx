import _ from 'lodash';

import { buildExpandColumn } from '@@/datatables/expand-column';

import { name } from './columns.name';
import { status } from './columns.status';
import {
  appType,
  created,
  image,
  namespace,
  published,
  stackName,
} from './columns';
import { Application } from './types';

export function useColumns(hideStacks: boolean) {
  const baseColumns = useBaseColumns(hideStacks);

  return _.compact([buildExpandColumn<Application>(), ...baseColumns]);
}

export function useBaseColumns(hideStacks: boolean) {
  return _.compact([
    name,
    !hideStacks && stackName,
    namespace,
    image,
    appType,
    status,
    published,
    created,
  ]);
}
