var ConstraintOperator = {
  EQ: 'eq',
  NEQ: 'neq'
};

function ConstraintModel(op, key, value) {
  this.op = op;
  this.value = value;
  this.key = key;
}
// node.id        node.id==2ivku8v2gvtg4
// node.hostname  node.hostname!=node-2
// node.role      node.role==manager
// MISSING
// node.labels    node.labels.security==high
// engine.labels  engine.labels.operatingsystem==ubuntu 14.04
var patterns = {
  id: {
    nodeId: /(node\.id)/,
    nodeHostname: /(node\.hostname)/,
    nodeRole: /(node\.role)/,
    nodeLabels: /(node\.labels)/,
    engineLabels: /(node\.labels)/
  },
  op: {
    both: /(\s?(=|!)=\s?)/,
    eq: /(\s?==\s?)/,
    neq: /(\s?!=\s?)/
  },
  labelKey: /((node|engine)\.labels\.)/,
  value: /((node\.(id|hostname|role|(labels\..*)))|(engine\.labels\..*))\s?(=|!)=\s?/
};

function matchesConstraint(value, constraint) {
  if (constraint && ((constraint.op === ConstraintOperator.EQ &&
        value !== constraint.value) ||
      (constraint.op === ConstraintOperator.NEQ &&
        value === constraint.value))) {
    return false;
  }
  return true;
}

function matchesLabel(labels, constraint) {
  if (!constraint) {
    return true;
  }
  var found = labels.find(function (label) {
    return label.key === constraint.key && label.value === constraint.value;
  });
  return found !== undefined;
}

angular.module('portainer.docker')
  .factory('ConstraintsHelper', [function ConstraintsHelperFactory() {
    'use strict';
    return {
      transformConstraints: function (constraints) {
        var transform = {};
        angular.forEach(constraints, function (cons) {
          var value = cons.replace(patterns.value, '').trim();
          var key = cons.replace(patterns.labelKey, '').replace(patterns.op.both, '').replace(value, '');
          var op;

          if (cons.match(patterns.op.eq)) {
            op = ConstraintOperator.EQ;
          } else if (cons.match(patterns.op.NEQ)) {
            op = ConstraintOperator.NEQ;
          }

          if (cons.match(patterns.id.nodeId)) {
            transform.nodeId = new ConstraintModel(op, key, value);
          } else if (cons.match(patterns.id.nodeHostname)) {
            transform.nodeHostname = new ConstraintModel(op, key, value);
          } else if (cons.match(patterns.id.nodeRole)) {
            transform.nodeRole = new ConstraintModel(op, key, value);
          } else if (cons.match(patterns.id.nodeLabels)) {
            transform.nodeLabels = new ConstraintModel(op, key, value);
          } else if (cons.match(patterns.id.engineLabels)) {
            transform.engineLabels = new ConstraintModel(op, key, value);
          }
        });
        return transform;
      },

      matchesServiceConstraints: function (service, node) {
        if (service.Constraints === undefined || service.Constraints.length === 0) {
          return true;
        }
        var constraints = this.transformConstraints(angular.copy(service.Constraints));
        if (matchesConstraint(node.Id, constraints.nodeId) &&
          matchesConstraint(node.Hostname, constraints.nodeHostname) &&
          matchesConstraint(node.Role, constraints.nodeRole) &&
          matchesLabel(node.Labels, constraints.nodeLabels) &&
          matchesLabel(node.EngineLabels, constraints.engineLabels)
        ) {
          return true;
        }
        return false;
      }
    };
  }]);