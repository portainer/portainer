import angular from 'angular';

import { Header, HeaderAngular } from './Header';
import { HeaderContent, HeaderContentAngular } from './HeaderContent';
import { HeaderTitle, HeaderTitleAngular } from './HeaderTitle';

export { Header, HeaderTitle, HeaderContent };

export default angular
  .module('portainer.app.components.header', [])

  .component('rdHeader', HeaderAngular)
  .component('rdHeaderContent', HeaderContentAngular)
  .component('rdHeaderTitle', HeaderTitleAngular).name;
