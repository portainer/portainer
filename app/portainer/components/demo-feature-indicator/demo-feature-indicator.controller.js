class DemoFeatureIndicatorController {
  /* @ngInject */
  constructor(StateManager) {
    Object.assign(this, { StateManager });

    this.isDemo = false;
  }

  $onInit() {
    const state = this.StateManager.getState();

    this.isDemo = state.application.demoEnvironment.enabled;
  }
}

export default DemoFeatureIndicatorController;
