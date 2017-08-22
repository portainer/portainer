angular.module('extension.storidge')
.factory('StoridgeNodeService', ['$q', function StoridgeNodeServiceFactory($q) {
  'use strict';
  var service = {};

  service.nodes = function() {
    var nodes = {
      'nodes': {
        'localhost.localdoma': {
          'ip': '192.168.1.10',
          'id': '8f6fc22b',
          'role': 'sds',
          'status': 'normal'
        }
      }
    };
    return $q.when(nodes);
  };

  service.node = function(nodeId) {
    var node = {
      'name': 'localhost.localdoma',
      'properties': {
        'domain:': '8f6fc22b',
        'domainID:': '8379bbe1',
        'freeBandwidth:': '2244.947MB/s',
        'freeCapacity:': '0.055TB',
        'freeIOPS:': '85313',
        'hdds:': '0',
        'metadataVersion:': '1.0',
        'nodes:': '1',
        'provisionedBandwidth:': '0.474MB/s',
        'provisionedCapacity:': '0.039TB',
        'provisionedIOPS:': '18',
        'ssds:': '3',
        'status:': 'Normal',
        'totalBandwidth:': '2245.000MB/s',
        'totalCapacity:': '0.058TB',
        'totalIOPS:': '85315',
        'usedBandwidth:': '0.053MB/s',
        'usedCapacity:': '0.003TB',
        'usedIOPS:': '2',
        'vdisks:': '1'
      }
    };
    return $q.when(node);
  };
  
  return service;
}]);
