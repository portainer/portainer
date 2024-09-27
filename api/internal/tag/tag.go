package tag

import (
	portainer "github.com/portainer/portainer/api"
)

type tagSet map[portainer.TagID]struct{}

// Set converts an array of ids to a set
func Set(tagIDs []portainer.TagID) tagSet {
	set := map[portainer.TagID]struct{}{}
	for _, tagID := range tagIDs {
		set[tagID] = struct{}{}
	}

	return set
}

// IntersectionCount returns the element count of the intersection of the
// provided sets
func IntersectionCount(sets ...tagSet) int {
	count := 0

	if len(sets) == 0 {
		return 0
	}

outerLoop:
	for tag := range sets[0] {
		for _, set := range sets {
			if _, ok := set[tag]; !ok {
				continue outerLoop
			}
		}

		count++
	}

	return count
}

// Union returns a set union of provided sets
func Union(sets ...tagSet) tagSet {
	union := tagSet{}

	for _, set := range sets {
		for tag := range set {
			union[tag] = struct{}{}
		}
	}

	return union
}

// Contains return true if setA contains setB
func Contains(setA tagSet, setB tagSet) bool {
	if len(setA) == 0 || len(setB) == 0 {
		return false
	}

	for tag := range setB {
		if _, ok := setA[tag]; !ok {
			return false
		}
	}

	return true
}

// Difference returns the set difference tagsA - tagsB
func Difference(setA tagSet, setB tagSet) tagSet {
	set := tagSet{}

	for tag := range setA {
		if _, ok := setB[tag]; !ok {
			set[tag] = struct{}{}
		}
	}

	return set
}
