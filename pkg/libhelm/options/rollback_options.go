package options

import "time"

// RollbackOptions defines options for rollback.
type RollbackOptions struct {
	// Required
	Name                    string
	Namespace               string
	KubernetesClusterAccess *KubernetesClusterAccess

	// Optional with defaults
	Version     int           // Target revision to rollback to (0 means previous revision)
	Timeout     time.Duration // Default: 5 minutes
	Wait        bool          // Default: false
	WaitForJobs bool          // Default: false
	Recreate    bool          // Default: false - whether to recreate pods
	Force       bool          // Default: false - whether to force recreation
}
