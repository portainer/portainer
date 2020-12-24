import _ from 'lodash-es';

import { ExternalStackViewModel } from '@/portainer/models/stack';

angular.module('portainer.app').factory('StackHelper', [
  function StackHelperFactory() {
    'use strict';
    var helper = {};

    helper.getExternalStacksFromContainers = function (containers) {
      return getExternalStacksFromLabel(containers, 'com.docker.compose.project', 2);
    };

    helper.getExternalStacksFromServices = function (services) {
      return getExternalStacksFromLabel(services, 'com.docker.stack.namespace', 1);
    };

    function getExternalStacksFromLabel(items, label, type) {
      return _.uniqBy(
        items.filter((item) => item.Labels && item.Labels[label]).map((item) => new ExternalStackViewModel(item.Labels[label], type, item.Created)),
        'Name'
      );
    }

    return helper;
  },
]);
