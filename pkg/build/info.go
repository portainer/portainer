package build

import "os"

/*
Package build contains variables that are set at build time using the -X linker flag.

These variables provide metadata about the build environment and specify the
versions of dependencies shipped with the application.

These variables are typically set during the build process using the -X flag with
the go build command, allowing for dynamic injection of build-time information.

It also contains structs and methods that can be used to display build, dependencies and runtime information.
*/

var (
	// BuildNumber is the build number of the application.
	BuildNumber string

	// ImageTag is the Docker image tag associated with this build.
	ImageTag string

	// NodejsVersion is the version of Node.js used in the build.
	NodejsVersion string

	// YarnVersion is the version of Yarn used in the build.
	YarnVersion string

	// WebpackVersion is the version of Webpack used in the build.
	WebpackVersion string

	// GoVersion is the version of Go used to compile the application.
	GoVersion string

	// GitCommit is the Git commit hash at the time of the build.
	GitCommit string

	// DepComposeVersion is the version of the Docker Compose plugin shipped with the application.
	DepComposeVersion string

	// DepDockerVersion is the version of the Docker binary shipped with the application.
	DepDockerVersion string

	// DepHelmVersion is the version of the Helm binary shipped with the application.
	DepHelmVersion string

	// DepKubectlVersion is the version of the Kubectl binary shipped with the application.
	DepKubectlVersion string
)

type (
	// BuildInfo contains information about how an application was built
	BuildInfo struct {
		BuildNumber    string
		ImageTag       string
		NodejsVersion  string
		YarnVersion    string
		WebpackVersion string
		GoVersion      string
		GitCommit      string
	}

	// DependenciesInfo contains information about the dependencies of Portainer
	DependenciesInfo struct {
		DockerVersion  string
		HelmVersion    string
		KubectlVersion string
		ComposeVersion string
	}

	// RuntimeInfo contains information about the runtime environment an application
	RuntimeInfo struct {
		Env []string `json:",omitempty"`
	}
)

// GetBuildInfo is a shortcut method to return the build information
func GetBuildInfo() BuildInfo {
	return BuildInfo{
		BuildNumber:    BuildNumber,
		ImageTag:       ImageTag,
		NodejsVersion:  NodejsVersion,
		YarnVersion:    YarnVersion,
		WebpackVersion: WebpackVersion,
		GoVersion:      GoVersion,
		GitCommit:      GitCommit,
	}
}

// GetDependenciesInfo is a shortcut method to return the dependencies information
func GetDependenciesInfo() DependenciesInfo {
	return DependenciesInfo{
		DockerVersion:  DepDockerVersion,
		HelmVersion:    DepHelmVersion,
		KubectlVersion: DepKubectlVersion,
		ComposeVersion: DepComposeVersion,
	}
}

// GetRuntimeInfo is a shortcut method to return the runtime information
func GetRuntimeInfo() RuntimeInfo {
	return RuntimeInfo{
		Env: os.Environ(),
	}
}
