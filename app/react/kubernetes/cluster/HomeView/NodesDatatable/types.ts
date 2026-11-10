import { Node } from 'kubernetes-types/core/v1';

import { SettableColumnsTableSettings } from '@@/datatables/types';

import { TableSettings as KubeTableSettings } from '../../../datatables/DefaultDatatableSettings';

export interface NodeRowData extends Node {
  isApi: boolean;
  isPublishedNode: boolean;
  Name: string;
}

export interface NodesTableSettings
  extends KubeTableSettings, SettableColumnsTableSettings {}
