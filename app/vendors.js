import angular from 'angular';
import 'angular-sanitize';
import 'ng-file-upload'; // build-image, import-image, kubernetes configuration data, endpoint security, init admin
import 'angular-messages'; // used for form helpers - ng-message
import 'angular-resource'; // used for http services
import 'angular-local-storage'; // used by localStorage service which is used every where
import 'angular-loading-bar'; // used in app/config.js and HeaderContainer - can be removed once we're not using the $http and $resource modules
import 'angular-clipboard'; // log-viewer, service edit, kube configmap edit, kube secret edit
import 'angular-file-saver'; // used in host-browser, volume-browser, logViewer, images edit, kube app logs, kube stacks logs, user-activity
import 'angularjs-scroll-glue'; // used in logViewer
import 'angularjs-slider'; // used in services create and edit
import 'bootstrap/dist/js/bootstrap.js';
import 'angular-ui-bootstrap';

window.angular = angular;
