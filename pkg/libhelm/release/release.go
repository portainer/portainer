package release

import "github.com/portainer/portainer/pkg/libhelm/time"

// Release is the struct that holds the information for a helm release.
// The struct definitions have been copied from the offical Helm Golang client/library.

// ReleaseElement is a struct that represents a release
// This is the official struct from the helm project (golang codebase) - exported
type ReleaseElement struct {
	Name       string `json:"name"`
	Namespace  string `json:"namespace"`
	Revision   string `json:"revision"`
	Updated    string `json:"updated"`
	Status     string `json:"status"`
	Chart      string `json:"chart"`
	AppVersion string `json:"app_version"`
}

// Release describes a deployment of a chart, together with the chart
// and the variables used to deploy that chart.
type Release struct {
	// Name is the name of the release
	Name string `json:"name,omitempty"`
	// Info provides information about a release
	// Info *Info `json:"info,omitempty"`
	// Chart is the chart that was released.
	Chart Chart `json:"chart,omitempty"`
	// Config is the set of extra Values added to the chart.
	// These values override the default values inside of the chart.
	Config map[string]interface{} `json:"config,omitempty"`
	// Manifest is the string representation of the rendered template.
	Manifest string `json:"manifest,omitempty"`
	// Hooks are all of the hooks declared for this release.
	Hooks []*Hook `json:"hooks,omitempty"`
	// Version is an int which represents the revision of the release.
	Version int `json:"version,omitempty"`
	// Namespace is the kubernetes namespace of the release.
	Namespace string `json:"namespace,omitempty"`
	// Labels of the release.
	// Disabled encoding into Json cause labels are stored in storage driver metadata field.
	Labels map[string]string `json:"-"`
}

// Chart is a helm package that contains metadata, a default config, zero or more
// optionally parameterizable templates, and zero or more charts (dependencies).
type Chart struct {
	// Raw contains the raw contents of the files originally contained in the chart archive.
	//
	// This should not be used except in special cases like `helm show values`,
	// where we want to display the raw values, comments and all.
	Raw []*File `json:"-"`
	// Metadata is the contents of the Chartfile.
	Metadata *Metadata `json:"metadata"`
	// Lock is the contents of Chart.lock.
	Lock *Lock `json:"lock"`
	// Templates for this chart.
	Templates []*File `json:"templates"`
	// Values are default config for this chart.
	Values map[string]interface{} `json:"values"`
	// Schema is an optional JSON schema for imposing structure on Values
	Schema []byte `json:"schema"`
	// Files are miscellaneous files in a chart archive,
	// e.g. README, LICENSE, etc.
	Files []*File `json:"files"`

	parent       *Chart
	dependencies []*Chart
}

// File represents a file as a name/value pair.
//
// By convention, name is a relative path within the scope of the chart's
// base directory.
type File struct {
	// Name is the path-like name of the template.
	Name string `json:"name"`
	// Data is the template as byte data.
	Data []byte `json:"data"`
}

// Metadata for a Chart file. This models the structure of a Chart.yaml file.
type Metadata struct {
	// The name of the chart. Required.
	Name string `json:"name,omitempty"`
	// The URL to a relevant project page, git repo, or contact person
	Home string `json:"home,omitempty"`
	// Source is the URL to the source code of this chart
	Sources []string `json:"sources,omitempty"`
	// A SemVer 2 conformant version string of the chart. Required.
	Version string `json:"version,omitempty"`
	// A one-sentence description of the chart
	Description string `json:"description,omitempty"`
	// A list of string keywords
	Keywords []string `json:"keywords,omitempty"`
	// A list of name and URL/email address combinations for the maintainer(s)
	Maintainers []*Maintainer `json:"maintainers,omitempty"`
	// The URL to an icon file.
	Icon string `json:"icon,omitempty"`
	// The API Version of this chart. Required.
	APIVersion string `json:"apiVersion,omitempty"`
	// The condition to check to enable chart
	Condition string `json:"condition,omitempty"`
	// The tags to check to enable chart
	Tags string `json:"tags,omitempty"`
	// The version of the application enclosed inside of this chart.
	AppVersion string `json:"appVersion,omitempty"`
	// Whether or not this chart is deprecated
	Deprecated bool `json:"deprecated,omitempty"`
	// Annotations are additional mappings uninterpreted by Helm,
	// made available for inspection by other applications.
	Annotations map[string]string `json:"annotations,omitempty"`
	// KubeVersion is a SemVer constraint specifying the version of Kubernetes required.
	KubeVersion string `json:"kubeVersion,omitempty"`
	// Dependencies are a list of dependencies for a chart.
	Dependencies []*Dependency `json:"dependencies,omitempty"`
	// Specifies the chart type: application or library
	Type string `json:"type,omitempty"`
}

// Maintainer describes a Chart maintainer.
type Maintainer struct {
	// Name is a user name or organization name
	Name string `json:"name,omitempty"`
	// Email is an optional email address to contact the named maintainer
	Email string `json:"email,omitempty"`
	// URL is an optional URL to an address for the named maintainer
	URL string `json:"url,omitempty"`
}

// Dependency describes a chart upon which another chart depends.
//
// Dependencies can be used to express developer intent, or to capture the state
// of a chart.
type Dependency struct {
	// Name is the name of the dependency.
	//
	// This must mach the name in the dependency's Chart.yaml.
	Name string `json:"name"`
	// Version is the version (range) of this chart.
	//
	// A lock file will always produce a single version, while a dependency
	// may contain a semantic version range.
	Version string `json:"version,omitempty"`
	// The URL to the repository.
	//
	// Appending `index.yaml` to this string should result in a URL that can be
	// used to fetch the repository index.
	Repository string `json:"repository"`
	// A yaml path that resolves to a boolean, used for enabling/disabling charts (e.g. subchart1.enabled )
	Condition string `json:"condition,omitempty"`
	// Tags can be used to group charts for enabling/disabling together
	Tags []string `json:"tags,omitempty"`
	// Enabled bool determines if chart should be loaded
	Enabled bool `json:"enabled,omitempty"`
	// ImportValues holds the mapping of source values to parent key to be imported. Each item can be a
	// string or pair of child/parent sublist items.
	ImportValues []interface{} `json:"import-values,omitempty"`
	// Alias usable alias to be used for the chart
	Alias string `json:"alias,omitempty"`
}

// Lock is a lock file for dependencies.
//
// It represents the state that the dependencies should be in.
type Lock struct {
	// Generated is the date the lock file was last generated.
	Generated time.Time `json:"generated"`
	// Digest is a hash of the dependencies in Chart.yaml.
	Digest string `json:"digest"`
	// Dependencies is the list of dependencies that this lock file has locked.
	Dependencies []*Dependency `json:"dependencies"`
}

// Info describes release information.
type Info struct {
	// FirstDeployed is when the release was first deployed.
	FirstDeployed time.Time `json:"first_deployed,omitempty"`
	// LastDeployed is when the release was last deployed.
	LastDeployed time.Time `json:"last_deployed,omitempty"`
	// Deleted tracks when this object was deleted.
	Deleted time.Time `json:"deleted"`
	// Description is human-friendly "log entry" about this release.
	Description string `json:"description,omitempty"`
	// Status is the current state of the release
	Status Status `json:"status,omitempty"`
	// Contains the rendered templates/NOTES.txt if available
	Notes string `json:"notes,omitempty"`
}

// Status is the status of a release
type Status string

// Hook defines a hook object.
type Hook struct {
	Name string `json:"name,omitempty"`
	// Kind is the Kubernetes kind.
	Kind string `json:"kind,omitempty"`
	// Path is the chart-relative path to the template.
	Path string `json:"path,omitempty"`
	// Manifest is the manifest contents.
	Manifest string `json:"manifest,omitempty"`
	// Events are the events that this hook fires on.
	Events []HookEvent `json:"events,omitempty"`
	// LastRun indicates the date/time this was last run.
	LastRun HookExecution `json:"last_run,omitempty"`
	// Weight indicates the sort order for execution among similar Hook type
	Weight int `json:"weight,omitempty"`
	// DeletePolicies are the policies that indicate when to delete the hook
	DeletePolicies []HookDeletePolicy `json:"delete_policies,omitempty"`
}

// HookEvent specifies the hook event
type HookEvent string

// A HookExecution records the result for the last execution of a hook for a given release.
type HookExecution struct {
	// StartedAt indicates the date/time this hook was started
	StartedAt time.Time `json:"started_at,omitempty"`
	// CompletedAt indicates the date/time this hook was completed.
	CompletedAt time.Time `json:"completed_at,omitempty"`
	// Phase indicates whether the hook completed successfully
	Phase HookPhase `json:"phase"`
}

// A HookPhase indicates the state of a hook execution
type HookPhase string

// HookDeletePolicy specifies the hook delete policy
type HookDeletePolicy string
