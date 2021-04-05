package migrator

func (m *Migrator) updateUsersAndRolesToDBVersion28() error {
	err := m.roleService.CreateOrUpdatePredefinedRoles()
	if err != nil {
		return err
	}

	return m.authorizationService.UpdateUsersAuthorizations()
}
