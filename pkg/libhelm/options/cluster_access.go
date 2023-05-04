package options

// KubernetesClusterAccess represents core details which can be used to generate KubeConfig file/data
type KubernetesClusterAccess struct {
	ClusterServerURL         string `example:"https://mycompany.k8s.com"`
	CertificateAuthorityFile string `example:"/data/tls/localhost.crt"`
	AuthToken                string `example:"ey..."`
}
