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
func TagDifference(tagsA []TagID, tagsB []TagID) []TagID {
	tagsNotInB := []TagID{}

	for _, tagAID := range tagsA {
		tagInB := false
		for _, tagBID := range tagsB {
			if tagBID == tagAID {
				tagInB = true
				break
			}
		}
		if !tagInB {
			tagsNotInB = append(tagsNotInB, tagAID)
		}
	}
	return tagsNotInB
}

// EndpointsTagSet creates a map between EndpointIDs to their associated tags
func EndpointsTagSet(endpoints []Endpoint, endpointGroups []EndpointGroup) map[EndpointID]map[TagID]bool {
	endpointsTagSet := map[EndpointID]map[TagID]bool{}

	groupMap := map[EndpointGroupID]EndpointGroup{}
	for _, group := range endpointGroups {
		groupMap[group.ID] = group
	}

	for _, endpoint := range endpoints {
		set := TagSet(endpoint.TagIDs)
		group, ok := groupMap[endpoint.GroupID]
		if ok {
			for _, tagID := range group.TagIDs {
				set[tagID] = true
			}
		}
		endpointsTagSet[endpoint.ID] = set
	}

	return endpointsTagSet
}
