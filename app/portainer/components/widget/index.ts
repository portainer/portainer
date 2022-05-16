import angular from 'angular';

import { rdWidgetBody } from './rd-widget-body';
import { rdWidget } from './rd-widget';
import { rdWidgetCustomHeader } from './rd-widget-custom-header';
import { rdWidgetFooter } from './rd-widget-footer';
import { rdWidgetTaskbar } from './rd-widget-taskbar';
import { rdWidgetTitle } from './rd-widget-title';

export default angular
  .module('portainer.app.components.widget', [])
  .component('rdWidget', rdWidget)
  .component('rdWidgetBody', rdWidgetBody)
  .component('rdWidgetCustomHeader', rdWidgetCustomHeader)
  .component('rdWidgetFooter', rdWidgetFooter)
  .component('rdWidgetHeader', rdWidgetTitle)
  .component('rdWidgetTaskbar', rdWidgetTaskbar).name;
