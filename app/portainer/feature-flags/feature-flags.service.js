import { EDITIONS, STATES } from './enums';

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
      'k8s-resourcepool-Ibquota': EDITIONS.BE,
      'k8s-resourcepool-storagequota': EDITIONS.BE,
      's3-backup-setting': EDITIONS.BE,
      'registry-management': EDITIONS.BE,
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
