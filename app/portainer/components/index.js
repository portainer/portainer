import angular from 'angular';

import formComponentsModule from './form-components';
import gitFormModule from './forms/git-form';
import porAccessManagementModule from './accessManagement';
import widgetModule from './widget';
import { boxSelectorModule } from './BoxSelector';

import { beFeatureIndicator } from './BEFeatureIndicator';
import { InformationPanelAngular } from './InformationPanel';

export default angular
  .module('portainer.app.components', [boxSelectorModule, widgetModule, gitFormModule, porAccessManagementModule, formComponentsModule])
  .component('informationPanel', InformationPanelAngular)
  .component('beFeatureIndicator', beFeatureIndicator).name;
