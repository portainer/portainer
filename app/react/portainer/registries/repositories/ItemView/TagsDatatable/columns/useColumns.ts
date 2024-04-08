import { useMemo } from 'react';
import _ from 'lodash';

import { humanize } from '@/portainer/filters/filters';
import { trimSHA } from '@/docker/filters/utils';

import { buildNameColumn } from '@@/datatables/buildNameColumn';

import { Tag } from '../types';

import { helper } from './helper';
import { buildCell } from './buildCell';
import { actions } from './actions';

const columns = [
  buildNameColumn<Tag>(
    'Name',
    'portainer.registries.registry.repository.tag',
    'tag',
    (item) => item.Name
  ),
  helper.display({
    header: 'OS/Architecture',
    cell: buildCell((model) => `${model.Os}/${model.Architecture}`),
  }),
  helper.display({
    header: 'Image ID',
    cell: buildCell((model) => trimSHA(model.ImageId)),
  }),
  helper.display({
    header: 'Compressed Size',
    cell: buildCell((model) => humanize(model.Size)),
  }),
];

export function useColumns(advancedFeaturesAvailable: boolean) {
  return useMemo(
    () => _.compact([...columns, advancedFeaturesAvailable && actions]),
    [advancedFeaturesAvailable]
  );
}
