var ConstraintOperator = {
  EQ: 'eq',
  NEQ: 'neq'
};

function ConstraintModel(op, value) {
  this.op = op;
  this.value = value;
}
// MISSING
// node.labels    node.labels.security==high
// engine.labels  engine.labels.operatingsystem==ubuntu 14.04
var patterns = {
  id: {
    nodeId: /(node\.id)/,
    nodeHostname: /(node\.hostname)/,
    nodeRole: /(node\.role)/
  },
  op: {
    eq: /(\s?==\s?)/,
    neq: /(\s?!=\s?)/
  },
  value: /(node\.(id|hostname|role)\s?(=|!)=\s?)/
};



angular.module('portainer.docker')
  .factory('ConstraintsHelper', [function ConstraintsHelperFactory() {
    'use strict';
    return {
      transformConstraints: function (constraints) {
        var transform = {};
        angular.forEach(constraints, function (cons) {
          var value = cons.replace(patterns.value, '');
          var op;

          if (cons.match(patterns.op.eq))
            op = ConstraintOperator.EQ;
          else if (cons.match(patterns.op.NEQ))
            op = ConstraintOperator.NEQ;
          if (cons.match(patterns.id.nodeId))
            transform.nodeId = new ConstraintModel(op, value);
          else if (cons.match(patterns.id.nodeHostname))
            transform.nodeHostname = new ConstraintModel(op, value);
          else if (cons.match(patterns.id.nodeRole))
            transform.nodeRole = new ConstraintModel(op, value);
        });
        return transform;
      },

      matchesServiceConstraints: function (service, node) {
        if (service.Constraints === undefined || service.Constraints.length === 0) return true;
        var constraints = this.transformConstraints(angular.copy(service.Constraints));

        // e.g. node.id==2ivku8v2gvtg4
        if (constraints.nodeId) {
          if ((constraints.nodeId.op === ConstraintOperator.EQ &&
              node.Id !== constraints.nodeId.value) ||
            (constraints.nodeId.op === ConstraintOperator.NEQ &&
              node.Id === constraints.nodeId.value))
            return false;
        }
        // e.g. node.hostname!=node-2
        if (constraints.nodeHostname) {
          if ((constraints.nodeHostname.op === ConstraintOperator.EQ &&
              node.Hostname !== constraints.nodeHostname.value) ||
            (constraints.nodeHostname.op === ConstraintOperator.NEQ &&
              node.Hostname === constraints.nodeHostname.value))
            return false;
        }
        // e.g. node.role==manager
        if (constraints.nodeRole) {
          if ((constraints.nodeRole.op === ConstraintOperator.EQ &&
              node.Role !== constraints.nodeRole.value) ||
            (constraints.nodeRole.op === ConstraintOperator.NEQ &&
              node.Role === constraints.nodeRole.value))
            return false;
        }
        return true;
      }
    };
  }]);