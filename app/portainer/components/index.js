import angular from 'angular';

import gitFormModule from './forms/git-form';

export default angular.module('portainer.app.components', [gitFormModule]).name;
