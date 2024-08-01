import { Edition, FeatureId, FeatureState } from './enums';

export const isBE = process.env.PORTAINER_EDITION === 'BE';
interface ServiceState {
  currentEdition: Edition;
  features: Record<FeatureId, Edition>;
}

const state: ServiceState = {
  currentEdition: Edition.CE,
  features: <Record<FeatureId, Edition>>{},
};

export async function init(edition: Edition) {
  // will be loaded on runtime
  const currentEdition = edition;
  const features = {
    [FeatureId.K8S_RESOURCE_POOL_LB_QUOTA]: Edition.BE,
    [FeatureId.K8S_RESOURCE_POOL_STORAGE_QUOTA]: Edition.BE,
    [FeatureId.K8S_CREATE_FROM_KUBECONFIG]: Edition.BE,
    [FeatureId.KAAS_PROVISIONING]: Edition.BE,
    [FeatureId.K8SINSTALL]: Edition.BE,
    [FeatureId.ACTIVITY_AUDIT]: Edition.BE,
    [FeatureId.EXTERNAL_AUTH_LDAP]: Edition.BE,
    [FeatureId.HIDE_INTERNAL_AUTH]: Edition.BE,
    [FeatureId.HIDE_INTERNAL_AUTHENTICATION_PROMPT]: Edition.BE,
    [FeatureId.K8S_SETUP_DEFAULT]: Edition.BE,
    [FeatureId.RBAC_ROLES]: Edition.BE,
    [FeatureId.REGISTRY_MANAGEMENT]: Edition.BE,
    [FeatureId.S3_BACKUP_SETTING]: Edition.BE,
    [FeatureId.S3_RESTORE]: Edition.BE,
    [FeatureId.TEAM_MEMBERSHIP]: Edition.BE,
    [FeatureId.FORCE_REDEPLOYMENT]: Edition.BE,
    [FeatureId.HIDE_AUTO_UPDATE_WINDOW]: Edition.BE,
    [FeatureId.IMAGE_UP_TO_DATE_INDICATOR]: Edition.BE,
    [FeatureId.STACK_PULL_IMAGE]: Edition.BE,
    [FeatureId.STACK_WEBHOOK]: Edition.BE,
    [FeatureId.CONTAINER_WEBHOOK]: Edition.BE,
    [FeatureId.POD_SECURITY_POLICY_CONSTRAINT]: Edition.BE,
    [FeatureId.HIDE_DOCKER_HUB_ANONYMOUS]: Edition.BE,
    [FeatureId.CUSTOM_LOGIN_BANNER]: Edition.BE,
    [FeatureId.K8S_EDIT_YAML]: Edition.BE,
    [FeatureId.ENFORCE_DEPLOYMENT_OPTIONS]: Edition.BE,
    [FeatureId.K8S_ADM_ONLY_USR_INGRESS_DEPLY]: Edition.BE,
    [FeatureId.K8S_ADM_ONLY_SECRETS]: Edition.BE,
    [FeatureId.K8S_ROLLING_RESTART]: Edition.BE,
    [FeatureId.K8S_ANNOTATIONS]: Edition.BE,
    [FeatureId.CA_FILE]: Edition.BE,
    [FeatureId.K8S_REQUIRE_NOTE_ON_APPLICATIONS]: Edition.BE,
    [FeatureId.PODMAN]: Edition.CE,
  };

  state.currentEdition = currentEdition;
  state.features = features;
}

export function selectShow(featureId?: FeatureId) {
  if (!featureId) {
    return FeatureState.VISIBLE;
  }

  if (!state.features[featureId]) {
    return FeatureState.HIDDEN;
  }

  if (state.features[featureId] <= state.currentEdition) {
    return FeatureState.VISIBLE;
  }

  if (state.features[featureId] === Edition.BE) {
    return FeatureState.LIMITED_BE;
  }

  return FeatureState.HIDDEN;
}

export function isLimitedToBE(featureId?: FeatureId) {
  return selectShow(featureId) === FeatureState.LIMITED_BE;
}
