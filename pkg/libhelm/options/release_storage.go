package options

import corev1 "k8s.io/client-go/kubernetes/typed/core/v1"

// ReleaseStorage supplies the Kubernetes Secret client backing the Helm release
// storage driver. It is offered only on the read options, because release records
// are Portainer's own bookkeeping rather than a resource the caller asked for: a
// caller with no Kubernetes access to Secrets can still be told which releases
// exist. Everything else the action touches keeps using KubernetesClusterAccess,
// so live cluster reads and every write still obey Kubernetes RBAC.
//
// Nil, the default, means "use KubernetesClusterAccess" and is what Community
// Edition passes. Whoever supplies a client takes on scoping the results and
// withholding release content, since the storage driver enforces neither.
//
// A kubernetes.Interface satisfies this through its CoreV1() method.
type ReleaseStorage = corev1.SecretsGetter
