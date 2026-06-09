package migrator

import (
	"fmt"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices/stack"
	gittypes "github.com/portainer/portainer/api/git/types"

	"github.com/rs/zerolog/log"
)

type legacyRepoConfig struct {
	URL            string
	ReferenceName  string
	ConfigFilePath string
	Authentication *legacyGitAuthentication
	ConfigHash     string
	TLSSkipVerify  bool
}

type legacyGitAuthentication struct {
	Username          string
	Password          string
	Provider          int `json:",omitempty"`
	AuthorizationType int `json:",omitempty"`
	GitCredentialID   int
}

func (lrc *legacyRepoConfig) toRepoConfig() *gittypes.RepoConfig {
	if lrc == nil {
		return nil
	}

	cfg := &gittypes.RepoConfig{
		URL:            lrc.URL,
		ReferenceName:  lrc.ReferenceName,
		ConfigFilePath: lrc.ConfigFilePath,
		ConfigHash:     lrc.ConfigHash,
		TLSSkipVerify:  lrc.TLSSkipVerify,
	}

	if lrc.Authentication != nil {
		if lrc.Authentication.GitCredentialID != 0 {
			log.Warn().
				Int("git_credential_id", lrc.Authentication.GitCredentialID).
				Msg("stack has a GitCredentialID reference which is not supported in CE; credential reference will be dropped during migration")
		}

		cfg.Authentication = &gittypes.GitAuthentication{
			Username:          lrc.Authentication.Username,
			Password:          lrc.Authentication.Password,
			Provider:          gittypes.GitProvider(lrc.Authentication.Provider),
			AuthorizationType: gittypes.GitCredentialAuthType(lrc.Authentication.AuthorizationType),
		}
	}

	return cfg
}

type legacyStack struct {
	ID         int               `json:"Id"`
	GitConfig  *legacyRepoConfig `json:"GitConfig"`
	WorkflowID *int
}

// sourceDedupeKey is the identity used to detect duplicate Sources during migration.
// Two stacks sharing the same URL and credentials must reuse the same Source record.
type sourceDedupeKey struct {
	url      string
	username string
	password string
}

func gitSourceKey(cfg *gittypes.RepoConfig) sourceDedupeKey {
	key := sourceDedupeKey{url: cfg.URL}
	if cfg.Authentication != nil {
		key.username = cfg.Authentication.Username
		key.password = cfg.Authentication.Password
	}

	return key
}

func (m *Migrator) migrateGitConfigToSources_2_43_0() error {
	log.Info().Msg("migrating git-backed stacks to Source+Workflow records")

	var legacyStacks []legacyStack

	err := m.stackService.Connection.GetAll(
		stack.BucketName,
		new(legacyStack),
		func(obj any) (any, error) {
			s, ok := obj.(*legacyStack)
			if !ok {
				return nil, fmt.Errorf("unexpected type reading stack bucket: %T", obj)
			}

			legacyStacks = append(legacyStacks, *s)

			return new(legacyStack), nil
		},
	)
	if err != nil {
		return err
	}

	existingSources, err := m.sourceService.ReadAll()
	if err != nil {
		return err
	}

	sourcesByKey := make(map[sourceDedupeKey]portainer.SourceID, len(existingSources))
	for _, src := range existingSources {
		if src.Git != nil {
			sourcesByKey[gitSourceKey(src.Git)] = src.ID
		}
	}

	for _, ls := range legacyStacks {
		if ls.GitConfig == nil || (ls.WorkflowID != nil && *ls.WorkflowID != 0) {
			continue
		}

		cfg := ls.GitConfig.toRepoConfig()
		cfg.URL = gittypes.SanitizeURL(cfg.URL)
		key := gitSourceKey(cfg)

		var newSrcID portainer.SourceID

		if err := m.stackService.Connection.UpdateTx(func(tx portainer.Transaction) error {
			srcID, exists := sourcesByKey[key]

			if !exists {
				src := &portainer.Source{
					Name: gittypes.RepoName(cfg.URL),
					Type: portainer.SourceTypeGit,
					Git:  cfg,
				}
				if err := m.sourceService.Tx(tx).Create(src); err != nil {
					return fmt.Errorf("failed to create source for stack %d: %w", ls.ID, err)
				}
				srcID = src.ID
				newSrcID = src.ID
			}

			liveStack, err := m.stackService.Tx(tx).Read(portainer.StackID(ls.ID))
			if err != nil {
				return fmt.Errorf("failed to read stack %d: %w", ls.ID, err)
			}

			wf := &portainer.Workflow{
				Name: liveStack.Name,
				Artifacts: []portainer.Artifact{{
					StackID: portainer.StackID(ls.ID),
					Files: []portainer.ArtifactFile{{
						SourceID: srcID,
						Path:     cfg.ConfigFilePath,
						Ref:      cfg.ReferenceName,
						Hash:     cfg.ConfigHash,
					}},
				}},
			}
			if err := m.workflowService.Tx(tx).Create(wf); err != nil {
				return fmt.Errorf("failed to create workflow for stack %d: %w", ls.ID, err)
			}

			liveStack.WorkflowID = wf.ID
			liveStack.GitConfig = nil

			return m.stackService.Tx(tx).Update(portainer.StackID(ls.ID), liveStack)
		}); err != nil {
			return fmt.Errorf("failed to migrate stack %d: %w", ls.ID, err)
		}

		if newSrcID != 0 {
			sourcesByKey[key] = newSrcID
		}
	}

	return nil
}

func (m *Migrator) migrateCustomTemplateGitConfigToSources_2_43_0() error {
	log.Info().Msg("migrating git-backed custom templates to Source records")

	templates, err := m.customTemplateService.ReadAll()
	if err != nil {
		return err
	}

	existingSources, err := m.sourceService.ReadAll()
	if err != nil {
		return err
	}

	sourcesByKey := make(map[sourceDedupeKey]portainer.SourceID, len(existingSources))
	for _, src := range existingSources {
		if src.Git != nil {
			sourcesByKey[gitSourceKey(src.Git)] = src.ID
		}
	}

	for i := range templates {
		t := &templates[i]
		if t.GitConfig == nil || t.Artifact != nil {
			continue
		}

		cfg := &gittypes.RepoConfig{
			URL:            gittypes.SanitizeURL(t.GitConfig.URL),
			Authentication: t.GitConfig.Authentication,
			TLSSkipVerify:  t.GitConfig.TLSSkipVerify,
		}

		if cfg.Authentication != nil && cfg.Authentication.GitCredentialID != 0 {
			log.Warn().
				Int("git_credential_id", cfg.Authentication.GitCredentialID).
				Msg("custom template has a GitCredentialID reference which is not supported in CE; credential reference will be dropped during migration")

			cfg.Authentication.GitCredentialID = 0
		}

		key := gitSourceKey(cfg)

		var newSrcID portainer.SourceID

		if err := m.stackService.Connection.UpdateTx(func(tx portainer.Transaction) error {
			srcID, exists := sourcesByKey[key]

			if !exists {
				src := &portainer.Source{
					Name: gittypes.RepoName(cfg.URL),
					Type: portainer.SourceTypeGit,
					Git:  cfg,
				}
				if err := m.sourceService.Tx(tx).Create(src); err != nil {
					return fmt.Errorf("failed to create source for custom template %d: %w", t.ID, err)
				}
				srcID = src.ID
				newSrcID = src.ID
			}

			t.Artifact = &portainer.Artifact{
				Files: []portainer.ArtifactFile{{
					SourceID: srcID,
					Path:     t.GitConfig.ConfigFilePath,
					Ref:      t.GitConfig.ReferenceName,
					Hash:     t.GitConfig.ConfigHash,
				}},
			}
			t.GitConfig = nil

			return m.customTemplateService.Tx(tx).Update(t.ID, t)
		}); err != nil {
			return fmt.Errorf("failed to migrate custom template %d: %w", t.ID, err)
		}

		if newSrcID != 0 {
			sourcesByKey[key] = newSrcID
		}
	}

	return nil
}
