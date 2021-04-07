import 'daterangepicker';
import 'daterangepicker/daterangepicker.css';

import { dateRangePicker } from './date-range-picker';

// ported from https://github.com/emalikterzi/angularjs-daterangepicker/blob/master/src/angular-daterangepicker.js

export default angular.module('portainer.components.datarangepicker', []).directive('dateRangePicker', dateRangePicker).name;
