import angular from 'angular';

import formComponentsModule from './form-components';
import porAccessManagementModule from './accessManagement';
import widgetModule from './widget';
import { boxSelectorModule } from './BoxSelector';

import { beFeatureIndicator } from './BEFeatureIndicator';
import { InformationPanelAngular } from './InformationPanel';
import { gitFormModule } from './forms/git-form';
import { tlsFieldsetModule } from './tls-fieldset';

export default angular
  .module('portainer.app.components', [boxSelectorModule, widgetModule, gitFormModule, porAccessManagementModule, formComponentsModule, tlsFieldsetModule])
  .component('informationPanel', InformationPanelAngular)
  .component('beFeatureIndicator', beFeatureIndicator).name;
