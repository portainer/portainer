package cli

import (
	portainer "github.com/portainer/portainer/api"

	"strings"

	"gopkg.in/alecthomas/kingpin.v2"
)

type pairListBool []portainer.Pair

// Set implementation for a list of portainer.Pair
func (l *pairListBool) Set(value string) error {
	p := new(portainer.Pair)

	// default to true.  example setting=true is equivalent to setting
	parts := strings.SplitN(value, "=", 2)
	if len(parts) != 2 {
		p.Name = parts[0]
		p.Value = "true"
	} else {
		p.Name = parts[0]
		p.Value = parts[1]
	}

	*l = append(*l, *p)
	return nil
}

// String implementation for a list of pair
func (l *pairListBool) String() string {
	return ""
}

// IsCumulative implementation for a list of pair
func (l *pairListBool) IsCumulative() bool {
	return true
}

func BoolPairs(s kingpin.Settings) (target *[]portainer.Pair) {
	target = new([]portainer.Pair)
	s.SetValue((*pairListBool)(target))
	return
}
