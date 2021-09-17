import { STATES } from '@/portainer/feature-flags/enums';

/* @ngInject */
export function limitedFeatureDirective(featureService) {
  return {
    restrict: 'A',
    link,
  };

  function link(scope, elem, attrs) {
    const { limitedFeatureClass, limitedFeature: featureId } = attrs;

    if (!featureId) {
      throw new Error('feature is required');
    }

    const state = featureService.selectShow(featureId);

    if (state === STATES.HIDDEN) {
      elem.hide();
      return;
    }

    if (state === STATES.VISIBLE) {
      return;
    }

    elem.addClass(limitedFeatureClass);
  }
}
