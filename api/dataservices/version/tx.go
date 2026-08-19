package version

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/database/models"
	"github.com/portainer/portainer/api/dataservices"
)

type ServiceTx struct {
	dataservices.BaseDataServiceTx[models.Version, int] // ID is not used
}

func (tx ServiceTx) InstanceID() (string, error) {
	v, err := tx.Version()
	if err != nil {
		return "", err
	}

	return v.InstanceID, nil
}

func (tx ServiceTx) UpdateInstanceID(ID string) error {
	v, err := tx.Version()
	if err != nil {
		if !dataservices.IsErrObjectNotFound(err) {
			return err
		}

		v = &models.Version{}
	}

	v.InstanceID = ID

	return tx.UpdateVersion(v)
}

func (tx ServiceTx) Edition() (portainer.SoftwareEdition, error) {
	v, err := tx.Version()
	if err != nil {
		return 0, err
	}

	return portainer.SoftwareEdition(v.Edition), nil
}

func (tx ServiceTx) Version() (*models.Version, error) {
	var v models.Version

	err := tx.Tx.GetObject(BucketName, []byte(versionKey), &v)
	if err != nil {
		return nil, err
	}

	return &v, nil
}

func (tx ServiceTx) UpdateVersion(version *models.Version) error {
	return tx.Tx.UpdateObject(BucketName, []byte(versionKey), version)
}

func (tx ServiceTx) SchemaVersion() (string, error) {
	var v models.Version

	err := tx.Tx.GetObject(BucketName, []byte(versionKey), &v)
	if err != nil {
		return "", err
	}

	return v.SchemaVersion, nil
}
