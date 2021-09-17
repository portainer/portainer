import angular from 'angular';

import { limitedFeatureDirective } from './limited-feature.directive';
import { featureService } from './feature-flags.service';

export default angular.module('portainer.feature-flags', []).directive('limitedFeature', limitedFeatureDirective).factory('featureService', featureService).name;
