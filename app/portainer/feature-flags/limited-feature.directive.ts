import _ from 'lodash';
import { IAttributes, IDirective, IScope } from 'angular';

import { FeatureState } from '@/portainer/feature-flags/enums';

import { selectShow } from './feature-flags.service';

const BASENAME = 'limitedFeature';

/* @ngInject */
export function limitedFeatureDirective(): IDirective {
  return {
    restrict: 'A',
    link,
  };

  function link(scope: IScope, elem: JQLite, attrs: IAttributes) {
    const { limitedFeatureDir: featureId } = attrs;

    if (!featureId) {
      return;
    }

    const limitedFeatureAttrs = Object.keys(attrs)
      .filter((attr) => attr.startsWith(BASENAME) && attr !== `${BASENAME}Dir`)
      .map((attr) => [_.kebabCase(attr.replace(BASENAME, '')), attrs[attr]]);

    const state = selectShow(featureId);

    if (state === FeatureState.HIDDEN) {
      elem.hide();
      return;
    }

    if (state === FeatureState.VISIBLE) {
      return;
    }

    limitedFeatureAttrs.forEach(([attr, value = attr]) => {
      const currentValue = elem.attr(attr) || '';
      elem.attr(attr, `${currentValue} ${value}`.trim());
    });
  }
}
