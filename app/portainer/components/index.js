import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { Tooltip } from '@@/Tip/Tooltip';
import { TooltipAngular } from 'Portainer/components/Tip/Tooltip';
import formComponentsModule from './form-components';
import gitFormModule from './forms/git-form';
import porAccessManagementModule from './accessManagement';
import widgetModule from './widget';
import { boxSelectorModule } from './BoxSelector';
import { pageHeaderModule } from './PageHeader';

import { beFeatureIndicator } from './BEFeatureIndicator';
import { InformationPanelAngular } from './InformationPanel';

export default angular
  .module('portainer.app.components', [pageHeaderModule, boxSelectorModule, widgetModule, gitFormModule, porAccessManagementModule, formComponentsModule])
  .component('informationPanel', InformationPanelAngular)

  .component('portainerTooltip', TooltipAngular)
  .component('tooltip', r2a(Tooltip, ['message', 'position']))
  .component('beFeatureIndicator', beFeatureIndicator).name;
