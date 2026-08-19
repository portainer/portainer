import { NodeAvailability, TaintEffect } from '../../types';

export interface NodeLabel {
  key: string;
  value: string;
  needsDeletion?: boolean;
  isNew: boolean;
  isChanged: boolean;
  isSystem: boolean;
}

export interface NodeTaint {
  key: string;
  value: string;
  effect: TaintEffect;
  needsDeletion?: boolean;
  isNew: boolean;
  isChanged: boolean;
}

export interface DrainOptions {
  ignoreDaemonSets: boolean;
  timeoutSeconds: number;
  gracePeriodSeconds: number;
  force: boolean;
  deleteEmptyDirData: boolean;
  disableEviction: boolean;
}

export interface NodeFormValues {
  availability: NodeAvailability;
  labels: NodeLabel[];
  taints: NodeTaint[];
  drainOptions: DrainOptions;
}

export const defaultDrainOptions: DrainOptions = {
  ignoreDaemonSets: true,
  timeoutSeconds: 60,
  gracePeriodSeconds: -1,
  force: false,
  deleteEmptyDirData: true,
  disableEviction: false,
};

export interface NodeValidationData {
  isDrainOperationInProgress: boolean;
  isContainsPortainer: boolean;
}
