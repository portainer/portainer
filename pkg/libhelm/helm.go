package libhelm

import (
	"github.com/portainer/portainer/pkg/libhelm/options"
	"github.com/portainer/portainer/pkg/libhelm/release"
)

// HelmPackageManager represents a service that interfaces with Helm
type HelmPackageManager interface {
	Show(showOpts options.ShowOptions) ([]byte, error)
	SearchRepo(searchRepoOpts options.SearchRepoOptions) ([]byte, error)
	Get(getOpts options.GetOptions) ([]byte, error)
	List(listOpts options.ListOptions) ([]release.ReleaseElement, error)
	Install(installOpts options.InstallOptions) (*release.Release, error)
	Uninstall(uninstallOpts options.UninstallOptions) error
}
