package portainer

func NewPrivateResourceControl(resourceIdentifier string, resourceType ResourceControlType, userID UserID) (*ResourceControl, error) {
	resourceControl := &ResourceControl{
		AdministratorsOnly: false,
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
