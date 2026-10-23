package kubernetes

// K8sResourceListOptions carries the common query options shared across Kubernetes
// resource read endpoints (pods, deployments, replica sets, ...). It is
// intentionally small and meant to grow (e.g. Limit, Continue, ResourceVersion)
// without having to change every resource method's signature.
type K8sResourceListOptions struct {
	// LabelSelector is a raw Kubernetes label selector (e.g. "app=nginx"). Empty means no filtering.
	LabelSelector string
	// FieldSelector is a raw Kubernetes field selector (e.g. "status.phase=Running"). Empty means no filtering.
	FieldSelector string
}
