package source

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	gittypes "github.com/portainer/portainer/api/git/types"
)

type ServiceTx struct {
	base dataservices.BaseDataServiceTx[portainer.Source, portainer.SourceID]
}

// Create creates a new source.
func (service ServiceTx) Create(context *userContext, source *portainer.Source) error {
	if err := validateUserContext(context); err != nil {
		return err
	}

	if source == nil {
		return ErrInvalidSource
	}

	if err := sanitizeGitSource(source); err != nil {
		return err
	}

	if err := sanitizeAccesses(context, source, nil); err != nil {
		return err
	}

	if err := enforceUniqueGitSource(service, source); err != nil {
		return err
	}

	return service.base.Tx.CreateObject(
		BucketName,
		func(id uint64) (int, any) {
			source.ID = portainer.SourceID(id)
			return int(source.ID), source
		},
	)
}

func (service ServiceTx) Read(context *userContext, ID portainer.SourceID) (*portainer.Source, error) {
	if err := validateUserContext(context); err != nil {
		return nil, err
	}

	source, err := service.base.Read(ID)
	if err != nil {
		return nil, err
	}

	if err := enforceUserPermissions(context, source, actionRead); err != nil {
		return nil, err
	}

	return source, err
}

// Access is not enforced on this to avoid the cost of deserialize
// Any user can scan the DB IDs using this method, so be mindful with usage of this func.
func (service ServiceTx) Exists(context *userContext, ID portainer.SourceID) (bool, error) {
	if err := validateUserContext(context); err != nil {
		return false, err
	}

	return service.base.Exists(ID)
}

// ReadAll fetches all sources the user can access, matching predicates
func (service ServiceTx) ReadAll(context *userContext, predicates ...func(portainer.Source) bool) ([]portainer.Source, error) {
	if err := validateUserContext(context); err != nil {
		return nil, err
	}

	list, err := service.base.ReadAll(predicates...)
	if err != nil {
		return nil, err
	}

	return filterSources(list, context), nil
}

// Update updates the source of id `ID` with the `source` content
// It validates that the user has access to the source, and has enough permissions to perform the action
func (service ServiceTx) Update(context *userContext, ID portainer.SourceID, source *portainer.Source) error {
	if err := validateUserContext(context); err != nil {
		return err
	}

	originalSource, err := service.base.Read(ID)
	if err != nil {
		return err
	}

	if source == nil || originalSource == nil {
		return ErrInvalidSource
	}

	if err := enforceUserPermissions(context, originalSource, actionWrite); err != nil {
		return err
	}

	if err := sanitizeGitSource(source); err != nil {
		return err
	}

	if err := sanitizeAccesses(context, source, originalSource); err != nil {
		return err
	}

	if err := enforceUniqueGitSource(service, source); err != nil {
		return err
	}

	return service.base.Update(ID, source)
}

// Delete deletes a source
// It validates that the user has access to the source, and has enough permissions to perform the action
func (service ServiceTx) Delete(context *userContext, ID portainer.SourceID) error {
	if err := validateUserContext(context); err != nil {
		return err
	}

	source, err := service.base.Read(ID)
	if err != nil {
		return err
	}

	if err := enforceUserPermissions(context, source, actionWrite); err != nil {
		return err
	}

	return service.base.Delete(ID)
}

// FindOrCreateGitSource returns an existing Source whose URL and authentication match cfg,
// or creates a new one. Only URL, authentication, and TLSSkipVerify are stored on the Source;
// per-stack fields (ReferenceName, ConfigFilePath, ConfigHash) belong in the Artifact.
// The function auto adds the user to an existing source if the user doesn't have access but provided a valid full
// config (URL+Auth)
func (service ServiceTx) FindOrCreateGitSource(context *userContext, src *portainer.Source) (*portainer.Source, error) {
	if err := validateUserContext(context); err != nil {
		return nil, err
	}

	if src == nil || src.Git == nil {
		return nil, ErrInvalidSource
	}

	normalized, err := normalizeGitSource(src)
	if err != nil {
		return nil, err
	}

	existing, err := service.base.ReadAll(func(s portainer.Source) bool {
		n, err := normalizeGitSource(&s)
		if err != nil {
			return false
		}
		return normalized.Equal(n)
	})
	if err != nil {
		return nil, err
	}

	if len(existing) > 0 {
		allowed := filterSources(existing, context)
		if len(allowed) > 0 {
			return &allowed[0], nil
		}

		// give user access to the first source if he doesn't have access
		// to any of the sources that have the same url+auth
		existing[0].UserAccesses = append(existing[0].UserAccesses, context.User.ID)
		if err := service.base.Update(existing[0].ID, &existing[0]); err != nil {
			return nil, err
		}
		return &existing[0], nil
	}

	toCreate := &portainer.Source{
		Name: src.Name,
		Type: portainer.SourceTypeGit,
		Git: &gittypes.RepoConfig{
			URL:            src.Git.URL,
			Authentication: src.Git.Authentication,
			TLSSkipVerify:  src.Git.TLSSkipVerify,
		},
		Public:             src.Public,
		AdministratorsOnly: src.AdministratorsOnly,
		UserAccesses:       src.UserAccesses,
		TeamAccesses:       src.TeamAccesses,
		OwnerID:            src.OwnerID,
	}

	if err := service.Create(context, toCreate); err != nil {
		return nil, err
	}

	return toCreate, nil
}
