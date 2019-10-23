package migrator

func (m *Migrator) updateResourceControlsToDBVersion21() error {
	legacyResourceControls, err := m.resourceControlService.ResourceControls()
	if err != nil {
		return err
	}

	for _, resourceControl := range legacyResourceControls {
		resourceControl.AdministratorsOnly = false

		err := m.resourceControlService.UpdateResourceControl(resourceControl.ID, &resourceControl)
		if err != nil {
			return err
		}
	}

	return nil
}
