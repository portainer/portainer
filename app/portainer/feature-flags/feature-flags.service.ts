import { Edition, FeatureId, FeatureState } from './enums';

interface ServiceState {
  currentEdition: Edition;
  features: Record<FeatureId, Edition>;
}

const state: ServiceState = {
  currentEdition: Edition.CE,
  features: <Record<FeatureId, Edition>>{},
};

export async function init(edition: Edition = Edition.CE) {
  // will be loaded on runtime
  const currentEdition = edition;
  const features = {
    [FeatureId.K8S_RESOURCE_POOL_LB_QUOTA]: Edition.BE,
    [FeatureId.K8S_RESOURCE_POOL_STORAGE_QUOTA]: Edition.BE,
    [FeatureId.ACTIVITY_AUDIT]: Edition.BE,
    [FeatureId.EXTERNAL_AUTH_LDAP]: Edition.BE,
    [FeatureId.HIDE_INTERNAL_AUTH]: Edition.BE,
    [FeatureId.HIDE_INTERNAL_AUTHENTICATION_PROMPT]: Edition.BE,
    [FeatureId.K8S_SETUP_DEFAULT]: Edition.BE,
    [FeatureId.RBAC_ROLES]: Edition.BE,
    [FeatureId.REGISTRY_MANAGEMENT]: Edition.BE,
    [FeatureId.S3_BACKUP_SETTING]: Edition.BE,
    [FeatureId.TEAM_MEMBERSHIP]: Edition.BE,
    [FeatureId.FORCE_REDEPLOYMENT]: Edition.BE,
    [FeatureId.HIDE_AUTO_UPDATE_WINDOW]: Edition.BE,
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
