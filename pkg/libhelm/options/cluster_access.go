package options

// KubernetesClusterAccess represents core details which can be used to generate KubeConfig file/data
type KubernetesClusterAccess struct {
	ClusterName              string `example:"portainer-cluster-endpoint-1"`
	ContextName              string `example:"portainer-ctx-endpoint-1"`
	UserName                 string `example:"portainer-user-endpoint-1"`
	ClusterServerURL         string `example:"https://mycompany.k8s.com"`
	CertificateAuthorityFile string `example:"/data/tls/localhost.crt"`
	AuthToken                string `example:"ey..."`
}
