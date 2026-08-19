package types

import (
	"github.com/portainer/portainer/pkg/libhelm/options"
	"github.com/portainer/portainer/pkg/libhelm/release"
	"helm.sh/helm/v4/pkg/cli"
	repo "helm.sh/helm/v4/pkg/repo/v1"
)

// HelmPackageManager represents a service that interfaces with Helm
type HelmPackageManager interface {
	Show(showOpts options.ShowOptions) ([]byte, error)
	SearchRepo(searchRepoOpts options.SearchRepoOptions) ([]byte, error)
	List(listOpts options.ListOptions) ([]release.ReleaseElement, error)
	Upgrade(upgradeOpts options.InstallOptions) (*release.Release, error)
	Uninstall(uninstallOpts options.UninstallOptions) error
	// ForceRemoveRelease removes all release history (Helm secrets) without attempting
	// to delete Kubernetes resources. Use as a last resort when Uninstall fails because
	// CRDs are missing and Helm can't build kubernetes objects for deletion.
	ForceRemoveRelease(uninstallOpts options.UninstallOptions) error
	Get(getOpts options.GetOptions) (*release.Release, error)
	GetHistory(historyOpts options.HistoryOptions) ([]*release.Release, error)
	Rollback(rollbackOpts options.RollbackOptions) (*release.Release, error)
}

type Repository interface {
	Charts() (repo.ChartVersions, error)
}

type HelmRepo struct {
	Settings *cli.EnvSettings
	Orig     *repo.Entry
}
