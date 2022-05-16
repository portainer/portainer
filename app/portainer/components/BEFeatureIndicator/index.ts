import controller from './BEFeatureIndicator.controller';

export const beFeatureIndicator = {
  templateUrl: './BEFeatureIndicator.html',
  controller,
  bindings: {
    feature: '<',
  },
  transclude: true,
};
