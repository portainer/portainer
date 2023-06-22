package tags

import (
	"errors"
	"net/http"

	"github.com/asaskevich/govalidator"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/pkg/featureflags"
)

type tagCreatePayload struct {
	Name string `validate:"required" example:"org/acme"`
}

func (payload *tagCreatePayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Name) {
		return errors.New("invalid tag name")
	}

	return nil
}

// @id TagCreate
// @summary Create a new tag
// @description Create a new tag.
// @description **Access policy**: administrator
// @tags tags
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param body body tagCreatePayload true "Tag details"
// @success 200 {object} portainer.Tag "Success"
// @failure 409 "Tag name exists"
// @failure 500 "Server error"
// @router /tags [post]
func (handler *Handler) tagCreate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload tagCreatePayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	var tag *portainer.Tag
	if featureflags.IsEnabled(portainer.FeatureNoTx) {
		tag, err = createTag(handler.DataStore, payload)
	} else {
		err = handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
			tag, err = createTag(tx, payload)
			return err
		})
	}

	return txResponse(w, tag, err)
}

func createTag(tx dataservices.DataStoreTx, payload tagCreatePayload) (*portainer.Tag, error) {
	tags, err := tx.Tag().ReadAll()
	if err != nil {
		return nil, httperror.InternalServerError("Unable to retrieve tags from the database", err)
	}

	for _, tag := range tags {
		if tag.Name == payload.Name {
			return nil, &httperror.HandlerError{StatusCode: http.StatusConflict, Message: "This name is already associated to a tag", Err: errors.New("a tag already exists with this name")}
		}
	}

	tag := &portainer.Tag{
		Name:           payload.Name,
		EndpointGroups: map[portainer.EndpointGroupID]bool{},
		Endpoints:      map[portainer.EndpointID]bool{},
	}

	err = tx.Tag().Create(tag)
	if err != nil {
		return nil, httperror.InternalServerError("Unable to persist the tag inside the database", err)
	}

	return tag, nil
}
