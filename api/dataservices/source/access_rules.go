package source

import (
	"errors"
	"slices"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/set"
	"github.com/portainer/portainer/api/slicesx"
)

var (
	ErrInvalidSource       = errors.New("invalid source")
	ErrInvalidUserContext  = errors.New("invalid user context")
	ErrNotEnoughPermission = errors.New("not enough permissions to perform this action")
	ErrDuplicateSource     = errors.New("a source with this URL and credentials already exists")
)

func validateUserContext(ctx UserContext) error {
	if ctx == nil {
		return ErrInvalidUserContext
	}

	return nil
}

type actionType string

const (
	actionRead  actionType = "read"
	actionWrite actionType = "write"
)

func enforceUserPermissions(ctx UserContext, source *portainer.Source, action actionType) error {
	if action == actionRead && userCanReadSource(source, ctx) {
		return nil
	}

	if action == actionWrite && userCanWriteSource(source, ctx) {
		return nil
	}

	return ErrNotEnoughPermission
}

func userCanWriteSource(source *portainer.Source, context UserContext) bool {
	if source == nil || context == nil {
		return false
	}

	if context.IsAdmin() {
		return true
	}

	if source.OwnerID != 0 && source.OwnerID == context.ID() && userCanReadSource(source, context) {
		return true
	}

	return false
}

func filterSources(sources []portainer.Source, context UserContext) []portainer.Source {
	return slicesx.Filter(sources, func(s portainer.Source) bool {
		return userCanReadSource(&s, context)
	})
}

func userCanReadSource(source *portainer.Source, context UserContext) bool {
	if source == nil || context == nil {
		return false
	}

	userTeams := context.TeamMemberships()

	if context.IsAdmin() || source.Public {
		return true
	}

	if source.AdministratorsOnly {
		return false
	}

	if slices.Contains(source.UserAccesses, context.ID()) {
		return true
	}

	if len(userTeams) == 0 || len(source.TeamAccesses) == 0 {
		return false
	}

	sTeams := set.ToSet(source.TeamAccesses)
	uTeams := set.ToSet(slicesx.Map(userTeams, func(u portainer.TeamMembership) portainer.TeamID { return u.TeamID }))

	return set.Intersection(sTeams, uTeams).Len() != 0
}

// enforceUniqueGitSource validates there are no other git sources with the same URL and credentials
// It ignores itself
func enforceUniqueGitSource(tx ServiceTx, src *portainer.Source) error {
	if src.Type != portainer.SourceTypeGit || src.Git == nil {
		return nil
	}

	normalized, err := normalizeGitSource(src)
	if err != nil {
		return err
	}

	existing, err := tx.base.ReadAll(func(s portainer.Source) bool {
		if src.ID == s.ID {
			return false
		}

		n, err := normalizeGitSource(&s)
		if err != nil {
			return false
		}

		return normalized.Equal(n)
	})

	if err != nil {
		return err
	}

	if len(existing) > 0 {
		return ErrDuplicateSource
	}
	return nil
}
