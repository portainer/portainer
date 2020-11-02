import angular from 'angular';

import { rdHeader } from './header';
import { rdHeaderContent } from './header-content';
import { rdHeaderTitle } from './header-title';

angular
  .module('portainer.app')

  .component('rdHeader', rdHeader)
  .component('rdHeaderContent', rdHeaderContent)
  .component('rdHeaderTitle', rdHeaderTitle);
