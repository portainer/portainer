import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { ListView } from '@/react/edge/templates/custom-templates/ListView';

export const templatesModule = angular
  .module('portainer.edge.react.views.templates', [])
  .component(
    'edgeCustomTemplatesView',
    r2a(withCurrentUser(withUIRouter(ListView)), [])
  ).name;
