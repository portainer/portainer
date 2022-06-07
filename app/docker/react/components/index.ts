import angular from 'angular';

import { TemplateListDropdownAngular } from '@/react/docker/app-templates/TemplateListDropdown';
import { TemplateListSortAngular } from '@/react/docker/app-templates/TemplateListSort';

export const componentsModule = angular
  .module('portainer.docker.react.components', [])
  .component('templateListDropdown', TemplateListDropdownAngular)
  .component('templateListSort', TemplateListSortAngular).name;
