package tags

import (
	"errors"
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
)

type tagCreatePayload struct {
	Name string `validate:"required" example:"org/acme"`
}

func (payload *tagCreatePayload) Validate(r *http.Request) error {
	if len(payload.Name) == 0 {
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
// @failure 409 "This name is already associated to a tag"
// @failure 500 "Server error"
// @router /tags [post]
func (handler *Handler) tagCreate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload tagCreatePayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	var tag *portainer.Tag
	err = handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		tag, err = createTag(tx, payload)
		return err
	})

	return txResponse(w, tag, err)
}

func createTag(tx dataservices.DataStoreTx, payload tagCreatePayload) (*portainer.Tag, error) {
	tags, err := tx.Tag().ReadAll()
	if err != nil {
		return nil, httperror.InternalServerError("Unable to retrieve tags from the database", err)
	}

	for _, tag := range tags {
		if tag.Name == payload.Name {
			return nil, httperror.Conflict("This name is already associated to a tag", errors.New("a tag already exists with this name"))
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
