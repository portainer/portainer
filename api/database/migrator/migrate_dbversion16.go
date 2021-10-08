package migrator

func (m *Migrator) updateExtensionsToDBVersion17() error {
	legacyExtensions, err := m.extensionService.Extensions()
	if err != nil {
		return err
	}

	for _, extension := range legacyExtensions {
		extension.License.Valid = true

		err = m.extensionService.Persist(&extension)
		if err != nil {
			return err
		}
	}

	return nil
}
