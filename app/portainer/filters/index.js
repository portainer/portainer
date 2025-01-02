import angular from 'angular';
import _ from 'lodash-es';

import { ownershipIcon } from '@/react/docker/components/datatable/createOwnershipColumn';
import {
  arrayToStr,
  endpointTypeName,
  getPairKey,
  getPairValue,
  humanize,
  ipAddress,
  isoDate,
  isoDateFromTimestamp,
  labelsToStr,
  stripProtocol,
  truncate,
  truncateLeftRight,
} from './filters';

angular
  .module('portainer.app')
  .filter('truncate', () => truncate)
  .filter('truncatelr', () => truncateLeftRight)
  .filter('capitalize', () => _.capitalize)
  .filter('stripprotocol', () => stripProtocol)
  .filter('humansize', () => humanize)
  .filter('getisodatefromtimestamp', () => isoDateFromTimestamp)
  .filter('getisodate', () => isoDate)
  .filter('key', () => getPairKey)
  .filter('value', () => getPairValue)
  .filter('emptyobject', () => _.isEmpty)
  .filter('ipaddress', () => ipAddress)
  .filter('arraytostr', () => arrayToStr)
  .filter('labelsToStr', () => labelsToStr)
  .filter('endpointtypename', () => endpointTypeName)
  .filter('ownershipicon', () => ownershipIcon);
