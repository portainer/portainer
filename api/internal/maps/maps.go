package maps

import "strings"

// Get a key from a nested map. Not support array for the moment
func Get(mapObj map[string]interface{}, path string, key string) interface{} {
	if path == "" {
		return mapObj[key]
	}
	paths := strings.Split(path, ".")
	v := mapObj
	for _, p := range paths {
		if p == "" {
			continue
		}
		value, ok := v[p].(map[string]interface{})
		if ok {
			v = value
		} else {
			return ""
		}
	}
	return v[key]
}

// Copy copies all key/value pairs in src adding them to dst.
// When a key in src is already present in dst,
// the value in dst will be overwritten by the value associated
// with the key in src.
func Copy[M ~map[K]V, K comparable, V any](dst, src M) {
	for k, v := range src {
		dst[k] = v
	}
}
