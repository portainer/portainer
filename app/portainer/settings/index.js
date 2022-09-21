import angular from 'angular';

import authenticationModule from './authentication';
import generalModule from './general';

export default angular.module('portainer.settings', [authenticationModule, generalModule]).name;
