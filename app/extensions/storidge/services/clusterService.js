angular.module('extension.storidge')
.factory('StoridgeClusterService', ['$q', 'StoridgeProfiles', function StoridgeClusterServiceFactory($q, StoridgeProfiles) {
  'use strict';
  var service = {};

  service.info = function() {
    var info = {
      'domain': '8f6fc22b',
      'domainID': '8379bbe1',
      'freeBandwidth': '2245.000MB/s',
      'freeCapacity': '0.055TB',
      'freeIOPS': '85315',
      'hdds': '0',
      'metadataVersion': '1.0',
      'nodes': '1',
      'provisionedBandwidth': '0.474MB/s',
      'provisionedCapacity': '0.039TB',
      'provisionedIOPS': '18',
      'ssds': '3',
      'status': 'Normal',
      'totalBandwidth': '2245.000MB/s',
      'totalCapacity': '0.058TB',
      'totalIOPS': '85315',
      'usedBandwidth': '0.000MB/s',
      'usedCapacity': '0.003TB',
      'usedIOPS': '0',
      'vdisks': '1'
    };
    return $q.when(info);
  };

  service.version = function() {
    var version = {
      'version': 'V0.2.1-1924'
    };
    return $q.when(version);
  };

  service.events = function() {
    var events = [
      '07/19/2017-02:24:08 [fatal] [DFS] vDisk 2 capacity 100% allocated. Please expand the vDisk immediately:4002',
      '07/19/2017-02:26:41 [info] [DFS] volume vd4 created on node 8f6fc22b:1009',
      '07/19/2017-02:27:59 [info] [DFS] volume vd4 removed on node 8f6fc22b:1011',
      '07/19/2017-02:28:00 [info] [DFS] volume vd3 removed on node 8f6fc22b:1011',
      '08/18/2017-09:51:12 [info] [DFS] volume vd2 removed on node 8f6fc22b:1011',
      '08/18/2017-09:51:12 [info] [DFS] volume vd1 removed on node 8f6fc22b:1011',
      '08/18/2017-10:20:18 [info] [DFS] volume vd1 created on node 8f6fc22b:1009',
      '08/18/2017-10:20:28 [info] [DFS] volume vd1 removed on node 8f6fc22b:1011',
      '08/20/2017-04:00:05 [info] [DFS] volume vd1 created on node 8f6fc22b:1009',
      '08/20/2017-04:13:07 [info] [DFS] volume vd1 removed on node 8f6fc22b:1011'
    ];
    return $q.when(events);
  };

  return service;
}]);
