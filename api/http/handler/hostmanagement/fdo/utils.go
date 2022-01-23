package fdo

func (handler *Handler) checkUniqueProfileName(name string, id int) (bool, error) {
	profiles, err := handler.DataStore.FDOProfile().FDOProfiles()
	if err != nil {
		return false, err
	}

	for _, profile := range profiles {
		if profile.Name == name && (id == -1 || id != int(profile.ID)) {
			return false, nil
		}
	}

	return true, nil
}
