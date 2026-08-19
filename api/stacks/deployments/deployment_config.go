package deployments

import "context"

type StackDeploymentConfiger interface {
	Deploy(ctx context.Context) error
	Undeploy(ctx context.Context) error
	GetResponse() string
}
