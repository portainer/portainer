package options

// releaseResource are the supported `helm get` sub-commands
// to see all available sub-commands run `helm get --help`
type releaseResource string

const (
	GetAll      releaseResource = "all"
	GetHooks    releaseResource = "hooks"
	GetManifest releaseResource = "manifest"
	GetNotes    releaseResource = "notes"
	GetValues   releaseResource = "values"
)

type GetOptions struct {
	Name                    string
	Namespace               string
	ReleaseResource         releaseResource
	KubernetesClusterAccess *KubernetesClusterAccess

	Env []string
}
