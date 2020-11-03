import angular from 'angular';

import authenticationModule from './authentication';

export default angular.module('portainer.settings', [authenticationModule]).name;
