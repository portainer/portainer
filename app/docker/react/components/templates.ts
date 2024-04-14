import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { StackFromCustomTemplateFormWidget } from '@/react/docker/templates/StackFromCustomTemplateFormWidget';

export const templatesModule = angular
  .module('portainer.docker.react.components.templates', [])

  .component(
    'stackFromCustomTemplateFormWidget',
    r2a(withUIRouter(withCurrentUser(StackFromCustomTemplateFormWidget)), [
      'template',
      'unselect',
    ])
  ).name;
