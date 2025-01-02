package compose

type ComposeDeployer struct{}

// NewComposeDeployer creates a new compose deployer
func NewComposeDeployer() *ComposeDeployer {
	return &ComposeDeployer{}
}
