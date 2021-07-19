package gittypes

type RepoConfig struct {
	// Git repo URL
	URL string `example:"https://github.com/portainer/portainer"`
	// Git reference name
	ReferenceName string `example:"master"`
	// Entry point file path
	ConfigFilePath string `example:"docker-compose.yml"`
}
