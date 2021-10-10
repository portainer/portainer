import angular from 'angular';

import { limitedFeatureDirective } from './limited-feature.directive';
import { featureService } from './feature-flags.service';
import './feature-flags.css';

export default angular.module('portainer.feature-flags', []).directive('limitedFeatureDir', limitedFeatureDirective).factory('featureService', featureService).name;
