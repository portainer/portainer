import angular from 'angular';

import { react2angular } from '@/react-tools/react2angular';

import { BoxSelector, buildOption } from './BoxSelector';
import { BoxSelectorAngular } from './BoxSelectorAngular';

export { BoxSelector, buildOption };
const BoxSelectorReact = react2angular(BoxSelector, [
  'value',
  'onChange',
  'options',
  'radioName',
]);

export default angular
  .module('app.portainer.component.box-selector', [])
  .component('boxSelectorReact', BoxSelectorReact)
  .component('boxSelector', BoxSelectorAngular).name;
