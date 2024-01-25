package build

import "runtime"

// Variables to be set during the build time
var BuildNumber string
var ImageTag string
var NodejsVersion string
var YarnVersion string
var WebpackVersion string
var GoVersion string = runtime.Version()
var GitCommit string
