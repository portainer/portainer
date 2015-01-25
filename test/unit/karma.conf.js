// base path, that will be used to resolve files and exclude
basePath = '../..';

// list of files / patterns to load in the browser
files = [
  JASMINE,
  JASMINE_ADAPTER,
  'assets/js/jquery-1.11.1.min.js',
  'assets/js/bootstrap.min.js',
  'assets/js/angularjs/1.2.6/angular.min.js',
  'assets/js/angularjs/1.2.6/angular-route.min.js',
  'assets/js/angularjs/1.2.6/angular-resource.min.js',
  'assets/js/ui-bootstrap/ui-bootstrap-custom-tpls-0.12.0.min.js',
  'test/assets/angular/angular-mocks.js',
  'app/**/*.js',
  'test/unit/**/*.spec.js',
  'dist/templates/**/*.js'
];

// use dots reporter, as travis terminal does not support escaping sequences
// possible values: 'dots' || 'progress'
reporters = 'progress';

// these are default values, just to show available options

// web server port
port = 8089;

// cli runner port
runnerPort = 9109;

urlRoot = '/__test/';

// enable / disable colors in the output (reporters and logs)
colors = true;

// level of logging
// possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
logLevel = LOG_INFO;

// enable / disable watching file and executing tests whenever any file changes
autoWatch = false;

// polling interval in ms (ignored on OS that support inotify)
autoWatchInterval = 0;

// Start these browsers, currently available:
// - Chrome
// - ChromeCanary
// - Firefox
// - Opera
// - Safari
// - PhantomJS
browsers = ['Chrome'];

// Continuous Integration mode
// if true, it capture browsers, run tests and exit
singleRun = true;