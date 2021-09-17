import { EDITIONS, STATES } from './enums';

export function featureService() {
  const state = {
    currentEdition: undefined,
    features: {},
  };

  return {
    selectShow,
    init,
  };

  async function init() {
    // will be loaded on runtime
    const currentEdition = EDITIONS.CE;
    const features = {
      'k8s-resourcepool-Ibquota': EDITIONS.BE,
      'k8s-resourcepool-storagequota': EDITIONS.BE,
      's3-backup-setting': EDITIONS.BE,
    };

    state.currentEdition = currentEdition;
    state.features = features;
  }

  function selectShow(featureID) {
    if (!state.features[featureID]) {
      return STATES.HIDDEN;
    }

    if (state.features[featureID] <= state.currentEdition) {
      return STATES.VISIBLE;
    }

    if (state.features[featureID] === EDITIONS.BE) {
      return STATES.LIMITED_BE;
    }

    return STATES.HIDDEN;
  }
}
