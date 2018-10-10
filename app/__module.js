import '../assets/css/vendor.css';
import '../assets/css/app.css';

import angular from 'angular';
window.angular = angular; // FIX

import moment from 'moment';
window.moment = moment;

import filesize from 'filesize';
window.filesize = filesize;

import 'angular-ui-bootstrap';
import '@uirouter/angularjs';
import 'ui-select';
import 'isteven-angular-multiselect/isteven-multi-select.js';
import 'angular-cookies';
import 'angular-sanitize';
import 'ng-file-upload';
import 'angular-messages';
import 'angular-resource';
import 'angular-utils-pagination';
import 'angular-local-storage';
import 'angular-jwt';
import 'angular-google-analytics';
import 'angular-json-tree';
import 'angular-loading-bar';
import 'angular-clipboard';
import 'angular-file-saver';
import 'angularjs-scroll-glue';
import 'angularjs-slider';

import './agent/_module';
import './azure/_module';
import './docker/__module';
import './extensions/storidge/__module';
import './portainer/__module';

angular.module('portainer', [
  'ui.bootstrap',
  'ui.router',
  'ui.select',
  'isteven-multi-select',
  'ngCookies',
  'ngSanitize',
  'ngFileUpload',
  'ngMessages',
  'ngResource',
  'angularUtils.directives.dirPagination',
  'LocalStorageModule',
  'angular-jwt',
  'angular-google-analytics',
  'angular-json-tree',
  'angular-loading-bar',
  'angular-clipboard',
  'ngFileSaver',
  'luegg.directives',
  // 'portainer.templates',
  'portainer.app',
  'portainer.agent',
  'portainer.azure',
  'portainer.docker',
  'extension.storidge',
  'rzModule'
]);

if (require) {
  var req = require.context('./', true, /^(.*\.(js$))[^.]*$/im);
  req.keys().forEach(function(key) {
    req(key);
  });
}
