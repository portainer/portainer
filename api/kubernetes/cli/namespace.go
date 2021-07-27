package cli

import (
	v1 "k8s.io/api/core/v1"
)

const (
	systemNamespaceLabel = "io.portainer.kubernetes.namespace.system"
)

func defaultSystemNamespaces() map[string]struct{} {
	return map[string]struct{}{
		"kube-system":     {},
		"kube-public":     {},
		"kube-node-lease": {},
		"portainer":       {},
	}
}

func isSystemNamespace(namespace v1.Namespace) bool {
	systemNamespaces := defaultSystemNamespaces()

	_, isSystem := systemNamespaces[namespace.Name]
	systemLabelValue, hasSystemLabel := namespace.Labels[systemNamespaceLabel]
	if hasSystemLabel {
		isSystem = systemLabelValue == "true"
	}

	return isSystem
}
