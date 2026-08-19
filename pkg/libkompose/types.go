package libkompose

// ConvertOptions configures the conversion behavior
type ConvertOptions struct {
	// Namespace specifies the Kubernetes namespace for generated resources.
	// If empty, resources will not have a namespace specified.
	Namespace string

	// CreateChart generates a Helm chart instead of plain Kubernetes manifests.
	// Default: false
	CreateChart bool

	// OutFile specifies the output file or directory path.
	// If empty, files will be created in the current directory.
	OutFile string

	// Replicas specifies the number of replicas for deployments.
	// Default: 1
	Replicas int

	// Volumes specifies the volume type to generate.
	// Options: "persistentVolumeClaim", "emptyDir", "hostPath", "configMap"
	// Default: "persistentVolumeClaim"
	Volumes string

	// PVCRequestSize specifies the size of PVC storage requests.
	// Default: empty (uses default PVC size)
	PVCRequestSize string

	// Provider specifies the target platform.
	// Options: "kubernetes", "openshift"
	// Default: "kubernetes"
	Provider string

	// Controller specifies the controller type to generate.
	// Options: "deployment", "daemonSet", "replicationController"
	// If empty, defaults to deployment for Kubernetes.
	Controller string

	// GenerateNetworkPolicies generates NetworkPolicy resources.
	// Default: false
	GenerateNetworkPolicies bool

	// YAMLIndent specifies the number of spaces for YAML indentation.
	// Default: 2
	YAMLIndent int

	// ToStdout prints the converted manifests to stdout instead of saving to files.
	// When true, OutFile and CreateChart are ignored.
	// Default: false
	ToStdout bool
}
