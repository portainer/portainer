export const API_ENDPOINT_AUTH = 'api/auth';
export const API_ENDPOINT_BACKUP = 'api/backup';
export const API_ENDPOINT_DOCKERHUB = 'api/dockerhub';
export const API_ENDPOINT_CUSTOM_TEMPLATES = 'api/custom_templates';
export const API_ENDPOINT_EDGE_GROUPS = 'api/edge_groups';
export const API_ENDPOINT_EDGE_JOBS = 'api/edge_jobs';
export const API_ENDPOINT_EDGE_STACKS = 'api/edge_stacks';
export const API_ENDPOINT_EDGE_TEMPLATES = 'api/edge_templates';
export const API_ENDPOINT_ENDPOINTS = 'api/endpoints';
export const API_ENDPOINT_ENDPOINT_GROUPS = 'api/endpoint_groups';
export const API_ENDPOINT_MOTD = 'api/motd';
export const API_ENDPOINT_EXTENSIONS = 'api/extensions';
export const API_ENDPOINT_REGISTRIES = 'api/registries';
export const API_ENDPOINT_RESOURCE_CONTROLS = 'api/resource_controls';
export const API_ENDPOINT_SETTINGS = 'api/settings';
export const API_ENDPOINT_STACKS = 'api/stacks';
export const API_ENDPOINT_STATUS = 'api/status';
export const API_ENDPOINT_SUPPORT = 'api/support';
export const API_ENDPOINT_USERS = 'api/users';
export const API_ENDPOINT_TAGS = 'api/tags';
export const API_ENDPOINT_TEAMS = 'api/teams';
export const API_ENDPOINT_TEAM_MEMBERSHIPS = 'api/team_memberships';
export const API_ENDPOINT_TEMPLATES = 'api/templates';
export const API_ENDPOINT_WEBHOOKS = 'api/webhooks';
export const PAGINATION_MAX_ITEMS = 10;
export const APPLICATION_CACHE_VALIDITY = 3600;
export const CONSOLE_COMMANDS_LABEL_PREFIX = 'io.portainer.commands.';
export const PREDEFINED_NETWORKS = ['host', 'bridge', 'none'];
export const KUBERNETES_SYSTEM_NAMESPACES = ['kube-system', 'kube-public', 'kube-node-lease', 'portainer'];

angular
  .module('portainer')
  .constant('API_ENDPOINT_AUTH', 'api/auth')
  .constant('API_ENDPOINT_DOCKERHUB', 'api/dockerhub')
  .constant('API_ENDPOINT_CUSTOM_TEMPLATES', 'api/custom_templates')
  .constant('API_ENDPOINT_ENDPOINTS', 'api/endpoints')
  .constant('API_ENDPOINT_ENDPOINT_GROUPS', 'api/endpoint_groups')
  .constant('API_ENDPOINT_MOTD', 'api/motd')
  .constant('API_ENDPOINT_REGISTRIES', 'api/registries')
  .constant('API_ENDPOINT_RESOURCE_CONTROLS', 'api/resource_controls')
  .constant('API_ENDPOINT_SETTINGS', 'api/settings')
  .constant('API_ENDPOINT_STACKS', 'api/stacks')
  .constant('API_ENDPOINT_STATUS', 'api/status')
  .constant('API_ENDPOINT_SUPPORT', 'api/support')
  .constant('API_ENDPOINT_USERS', 'api/users')
  .constant('API_ENDPOINT_TAGS', 'api/tags')
  .constant('API_ENDPOINT_TEAMS', 'api/teams')
  .constant('API_ENDPOINT_TEAM_MEMBERSHIPS', 'api/team_memberships')
  .constant('API_ENDPOINT_TEMPLATES', 'api/templates')
  .constant('API_ENDPOINT_WEBHOOKS', 'api/webhooks')
  .constant('PAGINATION_MAX_ITEMS', 10)
  .constant('APPLICATION_CACHE_VALIDITY', 3600)
  .constant('CONSOLE_COMMANDS_LABEL_PREFIX', 'io.portainer.commands.')
  .constant('PREDEFINED_NETWORKS', ['host', 'bridge', 'none'])
  .constant('KUBERNETES_DEFAULT_NAMESPACE', 'default')
  .constant('KUBERNETES_SYSTEM_NAMESPACES', ['kube-system', 'kube-public', 'kube-node-lease', 'portainer']);

export const PORTAINER_FADEOUT = 1500;
