import angular from 'angular';

import { LoadingAngular } from './Loading';
import { rdWidget, Widget } from './Widget';
import { rdWidgetBody, WidgetBody } from './WidgetBody';
import { rdWidgetCustomHeader } from './WidgetCustomHeader';
import { rdWidgetFooter, WidgetFooter } from './WidgetFooter';
import { rdWidgetTitle, WidgetTitle } from './WidgetTitle';
import { rdWidgetTaskbar, WidgetTaskbar } from './WidgetTaskbar';

export { Widget, WidgetBody, WidgetFooter, WidgetTitle, WidgetTaskbar };

export default angular
  .module('portainer.shared.components.widget', [])
  .component('rdLoading', LoadingAngular)
  .component('rdWidget', rdWidget)
  .component('rdWidgetBody', rdWidgetBody)
  .component('rdWidgetCustomHeader', rdWidgetCustomHeader)
  .component('rdWidgetFooter', rdWidgetFooter)
  .component('rdWidgetHeader', rdWidgetTitle)
  .component('rdWidgetTaskbar', rdWidgetTaskbar).name;
