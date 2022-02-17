export enum Edition {
  CE,
  BE,
}

export enum FeatureState {
  HIDDEN,
  VISIBLE,
  LIMITED_BE,
}

export enum FeatureId {
  K8S_RESOURCE_POOL_LB_QUOTA = 'k8s-resourcepool-Ibquota',
  K8S_RESOURCE_POOL_STORAGE_QUOTA = 'k8s-resourcepool-storagequota',
  RBAC_ROLES = 'rbac-roles',
  REGISTRY_MANAGEMENT = 'registry-management',
  K8S_SETUP_DEFAULT = 'k8s-setup-default',
  S3_BACKUP_SETTING = 's3-backup-setting',
  HIDE_INTERNAL_AUTHENTICATION_PROMPT = 'hide-internal-authentication-prompt',
  TEAM_MEMBERSHIP = 'team-membership',
  HIDE_INTERNAL_AUTH = 'hide-internal-auth',
  EXTERNAL_AUTH_LDAP = 'external-auth-ldap',
  ACTIVITY_AUDIT = 'activity-audit',
  FORCE_REDEPLOYMENT = 'force-redeployment',
  HIDE_AUTO_UPDATE_WINDOW = 'hide-auto-update-window',
  STACK_PULL_IMAGE = 'stack-pull-image',
  STACK_WEBHOOK = 'stack-webhook',
  CONTAINER_WEBHOOK = 'container-webhook',
}
