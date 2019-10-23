package portainer

import (
	uuid "github.com/satori/go.uuid"
)

func CreateResourceControlWithRandomToken(resourceIdentifier string, resourceType ResourceControlType) (*ResourceControl, error) {
	token, err := uuid.NewV4()
	if err != nil {
		return nil, err
	}

	resourceControl := &ResourceControl{
		AdministratorsOnly: true,
		Type:               resourceType,
		ResourceID:         resourceIdentifier,
		ResourceToken:      token.String(),
		SubResourceIDs:     []string{},
		UserAccesses:       []UserResourceAccess{},
		TeamAccesses:       []TeamResourceAccess{},
	}

	return resourceControl, nil
}
