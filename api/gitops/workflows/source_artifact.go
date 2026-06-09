package workflows

import (
	"fmt"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/portainer/portainer/api/set"
)

// gitSourceStore is the minimal intersection of CE and EE DataStoreTx that these functions need.
type gitSourceStore interface {
	Workflow() dataservices.WorkflowService
	Source() dataservices.SourceService
}

// GitSourceAndArtifactForStack returns the git Source and the ArtifactFile matching stackID
// from the workflow identified by workflowID.
// Source carries the shared fields (URL, auth, TLS); ArtifactFile carries the file-specific fields (ref, path, hash).
// Returns nil, nil, nil when workflowID is 0 or no matching entry is found.
func GitSourceAndArtifactForStack(tx gitSourceStore, workflowID portainer.WorkflowID, stackID portainer.StackID) (*portainer.Source, *portainer.ArtifactFile, error) {
	if workflowID == 0 {
		return nil, nil, nil
	}

	wf, err := tx.Workflow().Read(workflowID)
	if err != nil {
		return nil, nil, err
	}

	sourceMap, err := loadWorkflowSources(tx, wf)
	if err != nil {
		return nil, nil, err
	}

	for i, as := range wf.Artifacts {
		if as.StackID != stackID {
			continue
		}

		for j, file := range as.Files {
			src, ok := sourceMap[file.SourceID]
			if !ok {
				continue
			}

			if src.Type == portainer.SourceTypeGit {
				return &src, &wf.Artifacts[i].Files[j], nil
			}
		}
	}

	return nil, nil, nil
}

// GitSourceAndArtifactForEdgeStack returns the git Source and the ArtifactFile matching edgeStackID.
// Returns nil, nil, nil when workflowID is 0 or no matching entry is found.
func GitSourceAndArtifactForEdgeStack(tx gitSourceStore, workflowID portainer.WorkflowID, edgeStackID portainer.EdgeStackID) (*portainer.Source, *portainer.ArtifactFile, error) {
	if workflowID == 0 {
		return nil, nil, nil
	}

	wf, err := tx.Workflow().Read(workflowID)
	if err != nil {
		return nil, nil, err
	}

	sourceMap, err := loadWorkflowSources(tx, wf)
	if err != nil {
		return nil, nil, err
	}

	for i, as := range wf.Artifacts {
		if as.EdgeStackID != edgeStackID {
			continue
		}

		for j, file := range as.Files {
			src, ok := sourceMap[file.SourceID]
			if !ok {
				continue
			}

			if src.Type == portainer.SourceTypeGit {
				return &src, &wf.Artifacts[i].Files[j], nil
			}
		}
	}

	return nil, nil, nil
}

// MergeSourceAndFile builds a RepoConfig by combining shared fields from src (URL, auth, TLS)
// with file-specific fields from file (ref, path, hash).
func MergeSourceAndFile(src *portainer.Source, file *portainer.ArtifactFile) *gittypes.RepoConfig {
	if src == nil || src.Git == nil {
		return nil
	}

	cfg := &gittypes.RepoConfig{
		URL:            src.Git.URL,
		Authentication: src.Git.Authentication,
		TLSSkipVerify:  src.Git.TLSSkipVerify,
	}

	if file != nil {
		cfg.ReferenceName = file.Ref
		cfg.ConfigFilePath = file.Path
		cfg.ConfigHash = file.Hash
	}

	return cfg
}

// UpdateArtifactFileForStack finds the ArtifactFile matching stackID and sourceID in the workflow
// and applies fn to it, then persists the updated Workflow.
// A no-op if no matching artifact or file is found.
func UpdateArtifactFileForStack(tx gitSourceStore, workflowID portainer.WorkflowID, stackID portainer.StackID, sourceID portainer.SourceID, fn func(*portainer.ArtifactFile)) error {
	wf, err := tx.Workflow().Read(workflowID)
	if err != nil {
		return err
	}

	for i, as := range wf.Artifacts {
		if as.StackID != stackID {
			continue
		}

		for j, file := range as.Files {
			if file.SourceID == sourceID {
				fn(&wf.Artifacts[i].Files[j])

				return tx.Workflow().Update(workflowID, wf)
			}
		}
	}

	return nil
}

// UpdateArtifactFileForEdgeStack finds the ArtifactFile matching edgeStackID and sourceID in the workflow
// and applies fn to it, then persists the updated Workflow.
// A no-op if no matching artifact or file is found.
func UpdateArtifactFileForEdgeStack(tx gitSourceStore, workflowID portainer.WorkflowID, edgeStackID portainer.EdgeStackID, sourceID portainer.SourceID, fn func(*portainer.ArtifactFile)) error {
	wf, err := tx.Workflow().Read(workflowID)
	if err != nil {
		return err
	}

	for i, as := range wf.Artifacts {
		if as.EdgeStackID != edgeStackID {
			continue
		}

		for j, file := range as.Files {
			if file.SourceID == sourceID {
				fn(&wf.Artifacts[i].Files[j])

				return tx.Workflow().Update(workflowID, wf)
			}
		}
	}

	return nil
}

// FindOrCreateGitSource returns an existing Source whose URL and authentication match cfg,
// or creates a new one. Only URL, authentication, and TLSSkipVerify are stored on the Source;
// per-stack fields (ReferenceName, ConfigFilePath, ConfigHash) belong in the Artifact.
func FindOrCreateGitSource(tx gitSourceStore, src *portainer.Source) (*portainer.Source, error) {
	src.Git.URL = gittypes.SanitizeURL(src.Git.URL)

	existing, err := tx.Source().ReadAll(func(s portainer.Source) bool {
		return s.Type == portainer.SourceTypeGit &&
			s.Git != nil &&
			s.Git.URL == src.Git.URL &&
			gitAuthMatches(s.Git.Authentication, src.Git.Authentication)
	})
	if err != nil {
		return nil, err
	}

	if len(existing) > 0 {
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
	}

	if err := tx.Source().Create(toCreate); err != nil {
		return nil, err
	}

	return toCreate, nil
}

// SaveWorkflowGitConfig persists URL/auth/TLS on the Source and ref/path/hash on the Artifact
// matched by matchArtifact. When the URL changes, an existing or new Source is located via
// FindOrCreateGitSource and the Workflow's SourceID is updated atomically alongside the Artifact fields.
func SaveWorkflowGitConfig(tx gitSourceStore, workflowID portainer.WorkflowID, matchArtifact func(portainer.Artifact) bool, oldSourceID portainer.SourceID, cfg *gittypes.RepoConfig) error {
	src, err := tx.Source().Read(oldSourceID)
	if err != nil {
		return fmt.Errorf("failed to read source: %w", err)
	}

	if src.Git == nil {
		return fmt.Errorf("source %d has no git configuration", oldSourceID)
	}

	newSourceID := oldSourceID

	if cfg.URL != src.Git.URL {
		newSrc, err := FindOrCreateGitSource(tx, &portainer.Source{
			Name: gittypes.RepoName(cfg.URL),
			Type: portainer.SourceTypeGit,
			Git:  cfg,
		})
		if err != nil {
			return fmt.Errorf("failed to find or create source: %w", err)
		}

		newSourceID = newSrc.ID
	} else {
		src.Git.Authentication = cfg.Authentication
		src.Git.TLSSkipVerify = cfg.TLSSkipVerify

		if err := tx.Source().Update(src.ID, src); err != nil {
			return fmt.Errorf("failed to update source: %w", err)
		}
	}

	wf, err := tx.Workflow().Read(workflowID)
	if err != nil {
		return fmt.Errorf("failed to read workflow: %w", err)
	}

	for i, as := range wf.Artifacts {
		if !matchArtifact(as) {
			continue
		}

		for j, file := range as.Files {
			if file.SourceID != oldSourceID {
				continue
			}

			wf.Artifacts[i].Files[j].Ref = cfg.ReferenceName
			wf.Artifacts[i].Files[j].Path = cfg.ConfigFilePath
			wf.Artifacts[i].Files[j].Hash = cfg.ConfigHash

			if newSourceID != oldSourceID {
				wf.Artifacts[i].Files[j].SourceID = newSourceID
			}

			break
		}

		break
	}

	return tx.Workflow().Update(workflowID, wf)
}

// LoadWorkflowMap fetches workflows by their IDs and returns them keyed by ID.
func LoadWorkflowMap(tx gitSourceStore, ids set.Set[portainer.WorkflowID]) (map[portainer.WorkflowID]portainer.Workflow, error) {
	result := make(map[portainer.WorkflowID]portainer.Workflow, len(ids))
	for id := range ids {
		wf, err := tx.Workflow().Read(id)
		if err != nil {
			return nil, err
		}
		result[id] = *wf
	}

	return result, nil
}

// LoadWorkflowAndSourceMaps fetches workflows by their IDs and the sources they reference,
// collecting source IDs in a single pass over the workflows.
func LoadWorkflowAndSourceMaps(tx gitSourceStore, ids set.Set[portainer.WorkflowID]) (map[portainer.WorkflowID]portainer.Workflow, map[portainer.SourceID]portainer.Source, error) {
	wfMap := make(map[portainer.WorkflowID]portainer.Workflow, len(ids))
	sourceIDs := make(set.Set[portainer.SourceID])
	for id := range ids {
		wf, err := tx.Workflow().Read(id)
		if err != nil {
			return nil, nil, err
		}
		wfMap[id] = *wf
		for _, as := range wf.Artifacts {
			for _, f := range as.Files {
				sourceIDs.Add(f.SourceID)
			}
		}
	}

	srcMap, err := LoadSourceMap(tx, sourceIDs)
	if err != nil {
		return nil, nil, err
	}

	return wfMap, srcMap, nil
}

// loadWorkflowSources collects all unique SourceIDs referenced by wf and returns them as a map.
// This avoids reading the same Source record more than once when files share a SourceID.
func loadWorkflowSources(tx gitSourceStore, wf *portainer.Workflow) (map[portainer.SourceID]portainer.Source, error) {
	ids := make(set.Set[portainer.SourceID])
	for _, as := range wf.Artifacts {
		for _, f := range as.Files {
			ids.Add(f.SourceID)
		}
	}

	return LoadSourceMap(tx, ids)
}

// LoadSourceMap fetches sources by their IDs and returns them keyed by ID.
func LoadSourceMap(tx gitSourceStore, ids set.Set[portainer.SourceID]) (map[portainer.SourceID]portainer.Source, error) {
	result := make(map[portainer.SourceID]portainer.Source, len(ids))
	for id := range ids {
		src, err := tx.Source().Read(id)
		if err != nil {
			return nil, err
		}
		result[id] = *src
	}

	return result, nil
}

func gitAuthMatches(a, b *gittypes.GitAuthentication) bool {
	if a == nil && b == nil {
		return true
	}

	if a == nil || b == nil {
		return false
	}

	return a.Username == b.Username && a.Password == b.Password && a.GitCredentialID == b.GitCredentialID
}

// ValidateUniqueSourceURL validates there are no other sources with the same URL
func ValidateUniqueSourceURL(tx gitSourceStore, url string, sourceID portainer.SourceID) (bool, error) {
	normalizedURL, err := gittypes.NormalizeURL(gittypes.SanitizeURL(url))
	if err != nil {
		return false, err
	}

	existing, err := tx.Source().ReadAll(func(s portainer.Source) bool {
		if s.ID == sourceID || s.Type != portainer.SourceTypeGit || s.Git == nil {
			return false
		}

		normalized, err := gittypes.NormalizeURL(gittypes.SanitizeURL(s.Git.URL))

		return err == nil && normalized == normalizedURL
	})

	if err != nil {
		return false, err
	}

	return len(existing) == 0, nil
}
