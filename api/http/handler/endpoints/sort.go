package endpoints

import (
	"strings"

	"github.com/fvbommel/sortorder"
	portainer "github.com/portainer/portainer/api"
)

type EndpointsByName []portainer.Endpoint

func (e EndpointsByName) Len() int {
	return len(e)
}

func (e EndpointsByName) Swap(i, j int) {
	e[i], e[j] = e[j], e[i]
}

func (e EndpointsByName) Less(i, j int) bool {
	return sortorder.NaturalLess(strings.ToLower(e[i].Name), strings.ToLower(e[j].Name))
}

type EndpointsByGroup struct {
	endpointGroupNames map[portainer.EndpointGroupID]string
	endpoints          []portainer.Endpoint
}

func (e EndpointsByGroup) Len() int {
	return len(e.endpoints)
}

func (e EndpointsByGroup) Swap(i, j int) {
	e.endpoints[i], e.endpoints[j] = e.endpoints[j], e.endpoints[i]
}

func (e EndpointsByGroup) Less(i, j int) bool {
	if e.endpoints[i].GroupID == e.endpoints[j].GroupID {
		return false
	}

	groupA := endpointGroupNames[e.endpoints[i].GroupID]
	groupB := endpointGroupNames[e.endpoints[j].GroupID]

	return sortorder.NaturalLess(strings.ToLower(groupA), strings.ToLower(groupB))
}
