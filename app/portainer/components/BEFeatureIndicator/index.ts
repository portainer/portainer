import controller from './BEFeatureIndicator.controller';

import './BEFeatureIndicator.css';

export const beFeatureIndicatorAngular = {
  templateUrl: './BEFeatureIndicator.html',
  controller,
  bindings: {
    feature: '<',
  },
  transclude: true,
};

export { BEFeatureIndicator } from './BEFeatureIndicator';
