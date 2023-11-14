import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { AppTemplatesView } from '@/react/edge/templates/AppTemplatesView';

export const templatesModule = angular
  .module('portainer.app.react.components.templates', [])

  .component(
    'edgeAppTemplatesView',
    r2a(withCurrentUser(withUIRouter(AppTemplatesView)), [])
  ).name;
