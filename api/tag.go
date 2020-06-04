package portainer

type tagSet map[TagID]bool

// TagSet converts an array of ids to a set
func TagSet(tagIDs []TagID) tagSet {
	set := map[TagID]bool{}
	for _, tagID := range tagIDs {
		set[tagID] = true
	}
	return set
}

// TagIntersection returns a set intersection of the provided sets
func TagIntersection(sets ...tagSet) tagSet {
	intersection := tagSet{}
	if len(sets) == 0 {
		return intersection
	}
	setA := sets[0]
	for tag := range setA {
		inAll := true
		for _, setB := range sets {
			if !setB[tag] {
				inAll = false
				break
			}
		}

		if inAll {
			intersection[tag] = true
		}
	}

	return intersection
}

// TagUnion returns a set union of provided sets
func TagUnion(sets ...tagSet) tagSet {
	union := tagSet{}
	for _, set := range sets {
		for tag := range set {
			union[tag] = true
		}
	}
	return union
}

// TagContains return true if setA contains setB
func TagContains(setA tagSet, setB tagSet) bool {
	containedTags := 0
	for tag := range setB {
		if setA[tag] {
			containedTags++
		}
	}
	return containedTags == len(setA)
}

// TagDifference returns the set difference tagsA - tagsB
func TagDifference(setA tagSet, setB tagSet) tagSet {
	set := tagSet{}

	for tag := range setA {
		if !setB[tag] {
			set[tag] = true
		}
	}

	return set
}
