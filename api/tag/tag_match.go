package tag

import portainer "github.com/portainer/portainer/api"

// FullMatch returns true if environment tags matches all edge group tags
func FullMatch(edgeGroupTags []portainer.TagID, environmentTags tagSet) bool {
	return Contains(environmentTags, edgeGroupTags)
}

// PartialMatch returns true if environment tags matches at least one edge group tag
func PartialMatch(edgeGroupTags []portainer.TagID, environmentTags tagSet) bool {
	for _, tagID := range edgeGroupTags {
		if _, ok := environmentTags[tagID]; ok {
			return true
		}
	}

	return false
}
