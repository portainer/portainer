package migrator

func (m *Migrator) updateResourceControlsToDBVersion14() error {
	resourceControls, err := m.resourceControlService.ResourceControls()
	if err != nil {
		return err
	}

	for _, resourceControl := range resourceControls {
		if resourceControl.AdministratorsOnly == true {
			err = m.resourceControlService.DeleteResourceControl(resourceControl.ID)
			if err != nil {
				return err
			}
		}
	}

	return nil
}
