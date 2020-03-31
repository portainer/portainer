package portainer

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
