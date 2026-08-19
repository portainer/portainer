import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { CreateView } from '@/react/portainer/templates/custom-templates/CreateView';
import { EditView } from '@/react/portainer/templates/custom-templates/EditView';
import { AppTemplatesView } from '@/react/portainer/templates/app-templates/AppTemplatesView';
import { ListView } from '@/react/portainer/templates/custom-templates/ListView/ListView';

export const templatesModule = angular
  .module('portainer.app.react.views.templates', [])
  .component(
    'appTemplatesView',
    r2a(withCurrentUser(withUIRouter(AppTemplatesView)), [])
  )
  .component(
    'customTemplatesView',
    r2a(withCurrentUser(withUIRouter(ListView)), [])
  )
  .component(
    'createCustomTemplatesView',
    r2a(withCurrentUser(withUIRouter(CreateView)), [])
  )
  .component(
    'editCustomTemplatesView',
    r2a(withCurrentUser(withUIRouter(EditView)), [])
  ).name;
