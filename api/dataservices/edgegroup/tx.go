package edgegroup

import (
	"errors"

	portainer "github.com/portainer/portainer/api"
)

type ServiceTx struct {
	service *Service
	tx      portainer.Transaction
}

func (service ServiceTx) BucketName() string {
	return BucketName
}

// EdgeGroups return a slice containing all the Edge groups.
func (service ServiceTx) EdgeGroups() ([]portainer.EdgeGroup, error) {
	var groups = make([]portainer.EdgeGroup, 0)

	// err := service.tx.GetAllWithJsoniter(
	// 	BucketName,
	// 	&portainer.EdgeGroup{},
	// 	func(obj interface{}) (interface{}, error) {
	// 		group, ok := obj.(*portainer.EdgeGroup)
	// 		if !ok {
	// 			log.Debug().Str("obj", fmt.Sprintf("%#v", obj)).Msg("failed to convert to EdgeGroup object")
	// 			return nil, fmt.Errorf("Failed to convert to EdgeGroup object: %s", obj)
	// 		}
	// 		groups = append(groups, *group)

	// 		return &portainer.EdgeGroup{}, nil
	// 	})

	return groups, nil
}

// EdgeGroup returns an Edge group by ID.
func (service ServiceTx) EdgeGroup(ID portainer.EdgeGroupID) (*portainer.EdgeGroup, error) {
	var group portainer.EdgeGroup

	return &group, nil
}

// UpdateEdgeGroup updates an edge group.
func (service ServiceTx) UpdateEdgeGroup(ID portainer.EdgeGroupID, group *portainer.EdgeGroup) error {
	return nil
}

// UpdateEdgeGroupFunc is a no-op inside a transaction.
func (service ServiceTx) UpdateEdgeGroupFunc(ID portainer.EdgeGroupID, updateFunc func(edgeGroup *portainer.EdgeGroup)) error {
	return errors.New("cannot be called inside a transaction")
}

// DeleteEdgeGroup deletes an Edge group.
func (service ServiceTx) DeleteEdgeGroup(ID portainer.EdgeGroupID) error {
	return nil
}

func (service ServiceTx) Create(group *portainer.EdgeGroup) error {
	return nil
}
