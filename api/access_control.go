package portainer

func NewPrivateResourceControl(resourceIdentifier string, resourceType ResourceControlType, userID UserID) (*ResourceControl, error) {
	resourceControl := &ResourceControl{
		AdministratorsOnly: true,
		Type:               resourceType,
		ResourceID:         resourceIdentifier,
		SubResourceIDs:     []string{},
		UserAccesses: []UserResourceAccess{
			{
				UserID:      userID,
				AccessLevel: ReadWriteAccessLevel,
			},
		},
		TeamAccesses: []TeamResourceAccess{},
	}

	return resourceControl, nil
}
