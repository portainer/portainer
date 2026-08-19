package cache

import (
	"strconv"

	"github.com/VictoriaMetrics/fastcache"
	portainer "github.com/portainer/portainer/api"
)

var c = fastcache.New(1)

func key(k portainer.EndpointID) []byte {
	return []byte(strconv.Itoa(int(k)))
}

func Set(k portainer.EndpointID, v []byte) {
	c.Set(key(k), v)
}

func Get(k portainer.EndpointID) ([]byte, bool) {
	return c.HasGet(nil, key(k))
}

func Del(k portainer.EndpointID) {
	c.Del(key(k))
}
