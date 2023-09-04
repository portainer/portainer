package tag

// FullMatch returns true if environment tags matches all edge group tags
func FullMatch(edgeGroupTags tagSet, environmentTags tagSet) bool {
	return Contains(environmentTags, edgeGroupTags)
}

// PartialMatch returns true if environment tags matches at least one edge group tag
func PartialMatch(edgeGroupTags tagSet, environmentTags tagSet) bool {
	return len(Intersection(edgeGroupTags, environmentTags)) != 0
}
