import angular from 'angular';

import { apiServicesModule } from './api';
import { Notifications } from './notifications';
import { HttpRequestHelperAngular } from './http-request.helper';
import { EndpointProvider } from './endpointProvider';
import { AngularToReact } from './angularToReact';

export default angular
  .module('portainer.app.services', [apiServicesModule])
  .factory('Notifications', Notifications)
  .factory('EndpointProvider', EndpointProvider)
  .factory('HttpRequestHelper', HttpRequestHelperAngular)
  .factory('AngularToReact', AngularToReact).name;
