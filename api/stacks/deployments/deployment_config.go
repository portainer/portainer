package deployments

type StackDeploymentConfiger interface {
	GetUsername() string
	Deploy() error
	GetResponse() string
}
