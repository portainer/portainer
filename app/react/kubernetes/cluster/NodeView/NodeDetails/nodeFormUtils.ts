import { Taint } from 'kubernetes-types/core/v1';

import { TaintEffect } from '../../types';
import { isSystemLabel } from '../../nodeUtils';

import { NodeTaint, NodeLabel } from './types';

export function createNewLabel(): NodeLabel {
  return {
    key: '',
    value: '',
    needsDeletion: false,
    isNew: true,
    isChanged: false,
    isSystem: false,
  };
}

export function createNewTaint(): NodeTaint {
  return {
    key: '',
    value: '',
    effect: 'NoSchedule',
    needsDeletion: false,
    isNew: true,
    isChanged: false,
  };
}

export function createTaint(taint: Taint): NodeTaint {
  return {
    key: taint.key,
    value: taint.value ?? '',
    // We need to cast the effect to the correct type. This seems reasonable because of the docs
    // https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/#concepts
    // The allowed values for the effect field are: NoExecute, NoSchedule, PreferNoSchedule
    effect: taint.effect as TaintEffect,
    needsDeletion: false,
    isNew: false,
    isChanged: false,
  };
}

export function createLabel(label: [string, string]): NodeLabel {
  const [key, value] = label;
  const isSystem = isSystemLabel(key);
  const baseLabelValues = {
    key,
    value,
    isNew: false,
    isUsed: false,
    isChanged: false,
  };
  if (isSystem) {
    // omit needsDeletion, so the delete button is hidden
    return { ...baseLabelValues, isSystem: true };
  }
  return { ...baseLabelValues, needsDeletion: false, isSystem: false };
}
