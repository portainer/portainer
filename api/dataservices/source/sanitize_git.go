package source

import (
	portainer "github.com/portainer/portainer/api"
	gittypes "github.com/portainer/portainer/api/git/types"
)

// Sanitize the source URL and enforce fields values based on user context
func sanitizeGitSource(source *portainer.Source) error {
	if source == nil {
		return ErrInvalidSource
	}

	if source.Type != portainer.SourceTypeGit {
		return nil
	}

	if source.Git == nil {
		return ErrInvalidSource
	}

	var err error

	source.Git.URL, err = gittypes.NormalizeURL(gittypes.SanitizeURL(source.Git.URL))
	if err != nil {
		return err
	}

	return nil
}

func sanitizeAccesses(ctx UserContext, newValues *portainer.Source, previousValues *portainer.Source) error {
	if newValues == nil {
		return ErrInvalidSource
	}

	if ctx.IsAdmin() {
		if newValues.Public && newValues.AdministratorsOnly {
			newValues.Public = false
		}

		if newValues.Public || newValues.AdministratorsOnly {
			newValues.UserAccesses = []portainer.UserID{}
			newValues.TeamAccesses = []portainer.TeamID{}
		}

		if !newValues.Public && !newValues.AdministratorsOnly && len(newValues.UserAccesses) == 0 && len(newValues.TeamAccesses) == 0 {
			newValues.AdministratorsOnly = true
		}

		return nil
	}

	// Update flow ; regular user is not allowed to change the UAC, visibility or ownership of the source
	if previousValues != nil {
		newValues.UserAccesses = previousValues.UserAccesses
		newValues.TeamAccesses = previousValues.TeamAccesses
		newValues.Public = previousValues.Public
		newValues.AdministratorsOnly = previousValues.AdministratorsOnly
		newValues.OwnerID = previousValues.OwnerID
		return nil
	}

	// Create flow
	userAccesses := []portainer.UserID{ctx.ID()}
	if newValues.Public {
		userAccesses = []portainer.UserID{}
	}
	newValues.UserAccesses = userAccesses
	newValues.TeamAccesses = []portainer.TeamID{}
	newValues.AdministratorsOnly = false
	newValues.OwnerID = ctx.ID()
	return nil
}
