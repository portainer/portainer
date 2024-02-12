import { Node } from 'kubernetes-types/core/v1';

export interface NodeRowData extends Node {
  isApi: boolean;
  isPublishedNode: boolean;
  Name: string;
}
