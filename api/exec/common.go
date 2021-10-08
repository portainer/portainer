package exec

import "regexp"

var stackNameNormalizeRegex = regexp.MustCompile("[^-_a-z0-9]+")