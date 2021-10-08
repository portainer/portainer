import { EDITIONS, STATES } from './enums';

import * as FEATURE_IDS from './feature-ids';

export function featureService() {
  const state = {
    currentEdition: undefined,
    features: {},
  };

  return {
    selectShow,
    init,
    isLimitedToBE,
  };

  async function init() {
    // will be loaded on runtime
    const currentEdition = EDITIONS.CE;
    const features = {
      [FEATURE_IDS.K8S_RESOURCE_POOL_LB_QUOTA]: EDITIONS.BE,
      [FEATURE_IDS.K8S_RESOURCE_POOL_STORAGE_QUOTA]: EDITIONS.BE,
      [FEATURE_IDS.ACTIVITY_AUDIT]: EDITIONS.BE,
      [FEATURE_IDS.EXTERNAL_AUTH_LDAP]: EDITIONS.BE,
      [FEATURE_IDS.HIDE_INTERNAL_AUTH]: EDITIONS.BE,
      [FEATURE_IDS.HIDE_INTERNAL_AUTHENTICATION_PROMPT]: EDITIONS.BE,
      [FEATURE_IDS.K8S_SETUP_DEFAULT]: EDITIONS.BE,
      [FEATURE_IDS.RBAC_ROLES]: EDITIONS.BE,
      [FEATURE_IDS.REGISTRY_MANAGEMENT]: EDITIONS.BE,
      [FEATURE_IDS.S3_BACKUP_SETTING]: EDITIONS.BE,
      [FEATURE_IDS.TEAM_MEMBERSHIP]: EDITIONS.BE,
    };

    state.currentEdition = currentEdition;
    state.features = features;
  }

  function selectShow(featureId) {
    if (!state.features[featureId]) {
      return STATES.HIDDEN;
    }

    if (state.features[featureId] <= state.currentEdition) {
      return STATES.VISIBLE;
    }

    if (state.features[featureId] === EDITIONS.BE) {
      return STATES.LIMITED_BE;
    }

    return STATES.HIDDEN;
  }

  function isLimitedToBE(featureId) {
    return selectShow(featureId) === STATES.LIMITED_BE;
  }
}
