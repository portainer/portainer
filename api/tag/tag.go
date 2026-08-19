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

// IntersectionCount returns the element count of the intersection of the sets
func IntersectionCount(setA, setB tagSet) int {
	if len(setA) > len(setB) {
		setA, setB = setB, setA
	}

	count := 0

	for tag := range setA {
		if _, ok := setB[tag]; ok {
			count++
		}
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
func Contains(setA tagSet, setB []portainer.TagID) bool {
	if len(setA) == 0 || len(setB) == 0 {
		return false
	}

	for _, tag := range setB {
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
