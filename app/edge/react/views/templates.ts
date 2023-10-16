import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { ListView } from '@/react/edge/templates/custom-templates/ListView';
import { CreateView } from '@/react/edge/templates/custom-templates/CreateView';
import { EditView } from '@/react/edge/templates/custom-templates/EditView';
import { AppTemplatesView } from '@/react/edge/templates/AppTemplatesView';

export const templatesModule = angular
  .module('portainer.app.react.components.templates', [])
  .component(
    'edgeAppTemplatesView',
    r2a(withCurrentUser(withUIRouter(AppTemplatesView)), [])
  )
  .component(
    'edgeCustomTemplatesView',
    r2a(withCurrentUser(withUIRouter(ListView)), [])
  )
  .component(
    'edgeCreateCustomTemplatesView',
    r2a(withCurrentUser(withUIRouter(CreateView)), [])
  )
  .component(
    'edgeEditCustomTemplatesView',
    r2a(withCurrentUser(withUIRouter(EditView)), [])
  ).name;
