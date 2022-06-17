import angular from 'angular';

import { Header } from './HeaderContainer';
import { HeaderContent } from './HeaderContent';
import { HeaderTitle } from './HeaderTitle';

export const pageHeaderModule = angular
  .module('portainer.app.components.header', [])

  .component('rdHeader', Header)
  .component('rdHeaderContent', HeaderContent)
  .component('rdHeaderTitle', HeaderTitle).name;
