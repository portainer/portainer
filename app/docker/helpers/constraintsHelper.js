import _ from 'lodash-es';

function ConstraintModel(op, key, value) {
  this.op = op;
  this.value = value;
  this.key = key;
}

var patterns = {
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
};

function matchesConstraint(value, constraint) {
  if (!constraint || (constraint.op === patterns.op.eq && value === constraint.value) || (constraint.op === patterns.op.neq && value !== constraint.value)) {
    return true;
  }
  return false;
}

function matchesLabel(labels, constraint) {
  if (!constraint) {
    return true;
  }
  var found = _.find(labels, function (label) {
    return label.key === constraint.key && label.value === constraint.value;
  });
  return found !== undefined;
}

function extractValue(constraint, op) {
  return constraint.split(op).pop().trim();
}

function extractCustomLabelKey(constraint, op, baseLabelKey) {
  return constraint.split(op).shift().trim().replace(baseLabelKey, '');
}

angular.module('portainer.docker').factory('ConstraintsHelper', [
  function ConstraintsHelperFactory() {
    'use strict';
    return {
      transformConstraints: function (constraints) {
        var transform = {};
        for (var i = 0; i < constraints.length; i++) {
          var constraint = constraints[i];

          var op;
          if (constraint.includes(patterns.op.eq)) {
            op = patterns.op.eq;
          } else if (constraint.includes(patterns.op.neq)) {
            op = patterns.op.neq;
          }

          var value = extractValue(constraint, op);
          var key = '';
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
      },
      matchesServiceConstraints: function (service, node) {
        if (service.Constraints === undefined || service.Constraints.length === 0) {
          return true;
        }
        var constraints = this.transformConstraints(angular.copy(service.Constraints));
        if (
          matchesConstraint(node.Id, constraints.nodeId) &&
          matchesConstraint(node.Hostname, constraints.nodeHostname) &&
          matchesConstraint(node.Role, constraints.nodeRole) &&
          matchesLabel(node.Labels, constraints.nodeLabels) &&
          matchesLabel(node.EngineLabels, constraints.engineLabels)
        ) {
          return true;
        }
        return false;
      },
    };
  },
]);
