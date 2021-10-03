import _ from 'lodash-es';

import { STATES } from '@/portainer/feature-flags/enums';

const BASENAME = 'limitedFeature';

/* @ngInject */
export function limitedFeatureDirective(featureService) {
  return {
    restrict: 'A',
    link,
  };

  function link(scope, elem, attrs) {
    const { limitedFeatureDir: featureId } = attrs;

    if (!featureId) {
      return;
    }

    const limitedFeatureAttrs = Object.keys(attrs)
      .filter((attr) => attr.startsWith(BASENAME) && attr !== `${BASENAME}Dir`)
      .map((attr) => [_.kebabCase(attr.replace(BASENAME, '')), attrs[attr]]);

    const state = featureService.selectShow(featureId);

    if (state === STATES.HIDDEN) {
      elem.hide();
      return;
    }

    if (state === STATES.VISIBLE) {
      return;
    }

    limitedFeatureAttrs.forEach(([attr, value = attr]) => {
      const currentValue = elem.attr(attr) || '';
      elem.attr(attr, `${currentValue} ${value}`.trim());
    });
  }
}
