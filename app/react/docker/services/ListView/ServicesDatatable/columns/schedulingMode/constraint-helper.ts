import { Node } from 'docker-types/generated/1.41';

import { ServiceViewModel } from '@/docker/models/service';

class ConstraintModel {
  op: string;

  value: string;

  key: string;

  constructor(op: string, key: string, value: string) {
    this.op = op;
    this.value = value;
    this.key = key;
  }
}

const patterns = {
  id: {
    nodeId: 'node.id',
    nodeHostname: 'node.hostname',
    nodeRole: 'node.role',
    nodeLabels: 'node.labels.',
    engineLabels: 'engine.labels.',
  },
  op: {
    eq: '==',
    neq: '!=',
  },
} as const;

function matchesConstraint(
  value: string | undefined,
  constraint?: ConstraintModel
) {
  if (
    !constraint ||
    (constraint.op === patterns.op.eq && value === constraint.value) ||
    (constraint.op === patterns.op.neq && value !== constraint.value)
  ) {
    return true;
  }
  return false;
}

function matchesLabel(
  labels: Record<string, string> | undefined,
  constraint?: ConstraintModel
) {
  if (!constraint) {
    return true;
  }
  return Object.entries(labels || {}).some(
    ([key, value]) => key === constraint.key && value === constraint.value
  );
}

function extractValue(constraint: string, op: string) {
  return constraint.split(op).pop()?.trim() || '';
}

function extractCustomLabelKey(
  constraint: string,
  op: string,
  baseLabelKey: string
) {
  return constraint.split(op).shift()?.trim().replace(baseLabelKey, '') || '';
}

interface Constraint {
  nodeId?: ConstraintModel;
  nodeHostname?: ConstraintModel;
  nodeRole?: ConstraintModel;
  nodeLabels?: ConstraintModel;
  engineLabels?: ConstraintModel;
}

function transformConstraints(constraints: Array<string>) {
  const transform: Constraint = {};
  for (let i = 0; i < constraints.length; i++) {
    const constraint = constraints[i];

    let op = '';
    if (constraint.includes(patterns.op.eq)) {
      op = patterns.op.eq;
    } else if (constraint.includes(patterns.op.neq)) {
      op = patterns.op.neq;
    }

    const value = extractValue(constraint, op);
    let key = '';
    switch (true) {
      case constraint.includes(patterns.id.nodeId):
        transform.nodeId = new ConstraintModel(op, key, value);
        break;
      case constraint.includes(patterns.id.nodeHostname):
        transform.nodeHostname = new ConstraintModel(op, key, value);
        break;
      case constraint.includes(patterns.id.nodeRole):
        transform.nodeRole = new ConstraintModel(op, key, value);
        break;
      case constraint.includes(patterns.id.nodeLabels):
        key = extractCustomLabelKey(constraint, op, patterns.id.nodeLabels);
        transform.nodeLabels = new ConstraintModel(op, key, value);
        break;
      case constraint.includes(patterns.id.engineLabels):
        key = extractCustomLabelKey(constraint, op, patterns.id.engineLabels);
        transform.engineLabels = new ConstraintModel(op, key, value);
        break;
      default:
        break;
    }
  }
  return transform;
}

export function matchesServiceConstraints(
  service: ServiceViewModel,
  node: Node
) {
  if (service.Constraints === undefined || service.Constraints.length === 0) {
    return true;
  }
  const constraints = transformConstraints([...service.Constraints]);
  return (
    matchesConstraint(node.ID, constraints.nodeId) &&
    matchesConstraint(node.Description?.Hostname, constraints.nodeHostname) &&
    matchesConstraint(node.Spec?.Role, constraints.nodeRole) &&
    matchesLabel(node.Spec?.Labels, constraints.nodeLabels) &&
    matchesLabel(node.Description?.Engine?.Labels, constraints.engineLabels)
  );
}
