package images

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestImageParser(t *testing.T) {
	is := assert.New(t)

	// portainer/portainer-ee
	t.Run("", func(t *testing.T) {
		image, err := ParseImage(ParseImageOptions{
			Name: "portainer/portainer-ee",
		})
		is.NoError(err, "")
		is.Equal("docker.io/portainer/portainer-ee:latest", image.FullName())
		is.Equal("portainer/portainer-ee", image.opts.Name)
		is.Equal("latest", image.Tag)
		is.Equal("portainer/portainer-ee", image.Path)
		is.Equal("docker.io", image.Domain)
		is.Equal("docker.io/portainer/portainer-ee", image.Name())
		is.Equal("latest", image.Reference())
		is.Equal("docker.io/portainer/portainer-ee:latest", image.String())

	})
	// gcr.io/k8s-minikube/kicbase@sha256:02c921df998f95e849058af14de7045efc3954d90320967418a0d1f182bbc0b2
	t.Run("", func(t *testing.T) {
		image, err := ParseImage(ParseImageOptions{
			Name: "gcr.io/k8s-minikube/kicbase@sha256:02c921df998f95e849058af14de7045efc3954d90320967418a0d1f182bbc0b2",
		})
		is.NoError(err, "")
		is.Equal("gcr.io/k8s-minikube/kicbase@sha256:02c921df998f95e849058af14de7045efc3954d90320967418a0d1f182bbc0b2", image.FullName())
		is.Equal("gcr.io/k8s-minikube/kicbase@sha256:02c921df998f95e849058af14de7045efc3954d90320967418a0d1f182bbc0b2", image.opts.Name)
		is.Equal("", image.Tag)
		is.Equal("k8s-minikube/kicbase", image.Path)
		is.Equal("gcr.io", image.Domain)
		is.Equal("https://gcr.io/k8s-minikube/kicbase", image.HubLink)
		is.Equal("gcr.io/k8s-minikube/kicbase", image.Name())
		is.Equal("sha256:02c921df998f95e849058af14de7045efc3954d90320967418a0d1f182bbc0b2", image.Reference())
		is.Equal("gcr.io/k8s-minikube/kicbase@sha256:02c921df998f95e849058af14de7045efc3954d90320967418a0d1f182bbc0b2", image.String())
	})

	// gcr.io/k8s-minikube/kicbase:v0.0.30@sha256:02c921df998f95e849058af14de7045efc3954d90320967418a0d1f182bbc0b2
	t.Run("", func(t *testing.T) {
		image, err := ParseImage(ParseImageOptions{
			Name: "gcr.io/k8s-minikube/kicbase:v0.0.30@sha256:02c921df998f95e849058af14de7045efc3954d90320967418a0d1f182bbc0b2",
		})
		is.NoError(err, "")
		is.Equal("gcr.io/k8s-minikube/kicbase:v0.0.30", image.FullName())
		is.Equal("gcr.io/k8s-minikube/kicbase:v0.0.30@sha256:02c921df998f95e849058af14de7045efc3954d90320967418a0d1f182bbc0b2", image.opts.Name)
		is.Equal("v0.0.30", image.Tag)
		is.Equal("k8s-minikube/kicbase", image.Path)
		is.Equal("gcr.io", image.Domain)
		is.Equal("https://gcr.io/k8s-minikube/kicbase", image.HubLink)
		is.Equal("gcr.io/k8s-minikube/kicbase", image.Name())
		is.Equal("sha256:02c921df998f95e849058af14de7045efc3954d90320967418a0d1f182bbc0b2", image.Reference())
		is.Equal("gcr.io/k8s-minikube/kicbase:v0.0.30@sha256:02c921df998f95e849058af14de7045efc3954d90320967418a0d1f182bbc0b2", image.String())
	})
}

func TestUpdateParsedImage(t *testing.T) {
	is := assert.New(t)

	// gcr.io/k8s-minikube/kicbase:v0.0.30@sha256:02c921df998f95e849058af14de7045efc3954d90320967418a0d1f182bbc0b2
	t.Run("", func(t *testing.T) {
		image, err := ParseImage(ParseImageOptions{
			Name: "gcr.io/k8s-minikube/kicbase:v0.0.30@sha256:02c921df998f95e849058af14de7045efc3954d90320967418a0d1f182bbc0b2",
		})
		is.NoError(err, "")
		_ = image.WithTag("v0.0.31")
		is.Equal("gcr.io/k8s-minikube/kicbase:v0.0.31", image.FullName())
		is.Equal("gcr.io/k8s-minikube/kicbase:v0.0.30@sha256:02c921df998f95e849058af14de7045efc3954d90320967418a0d1f182bbc0b2", image.opts.Name)
		is.Equal("v0.0.31", image.Tag)
		is.Equal("k8s-minikube/kicbase", image.Path)
		is.Equal("gcr.io", image.Domain)
		is.Equal("https://gcr.io/k8s-minikube/kicbase", image.HubLink)
		is.Equal("gcr.io/k8s-minikube/kicbase", image.Name())
		is.Equal("sha256:02c921df998f95e849058af14de7045efc3954d90320967418a0d1f182bbc0b2", image.Reference())
		is.Equal("gcr.io/k8s-minikube/kicbase:v0.0.31@sha256:02c921df998f95e849058af14de7045efc3954d90320967418a0d1f182bbc0b2", image.String())
	})

	// gcr.io/k8s-minikube/kicbase:v0.0.30@sha256:02c921df998f95e849058af14de7045efc3954d90320967418a0d1f182bbc0b2
	t.Run("", func(t *testing.T) {
		image, err := ParseImage(ParseImageOptions{
			Name: "gcr.io/k8s-minikube/kicbase:v0.0.30@sha256:02c921df998f95e849058af14de7045efc3954d90320967418a0d1f182bbc0b2",
		})
		is.NoError(err, "")
		_ = image.WithDigest("sha256:02c921df998f95e849058af14de7045efc3954d90320967418a0d1f182bbc0b3")
		is.Equal("gcr.io/k8s-minikube/kicbase:v0.0.30", image.FullName())
		is.Equal("gcr.io/k8s-minikube/kicbase:v0.0.30@sha256:02c921df998f95e849058af14de7045efc3954d90320967418a0d1f182bbc0b2", image.opts.Name)
		is.Equal("v0.0.30", image.Tag)
		is.Equal("k8s-minikube/kicbase", image.Path)
		is.Equal("gcr.io", image.Domain)
		is.Equal("https://gcr.io/k8s-minikube/kicbase", image.HubLink)
		is.Equal("gcr.io/k8s-minikube/kicbase", image.Name())
		is.Equal("sha256:02c921df998f95e849058af14de7045efc3954d90320967418a0d1f182bbc0b3", image.Reference())
		is.Equal("gcr.io/k8s-minikube/kicbase:v0.0.30@sha256:02c921df998f95e849058af14de7045efc3954d90320967418a0d1f182bbc0b3", image.String())
	})

	// gcr.io/k8s-minikube/kicbase:v0.0.30@sha256:02c921df998f95e849058af14de7045efc3954d90320967418a0d1f182bbc0b2
	t.Run("", func(t *testing.T) {
		image, err := ParseImage(ParseImageOptions{
			Name: "gcr.io/k8s-minikube/kicbase:v0.0.30@sha256:02c921df998f95e849058af14de7045efc3954d90320967418a0d1f182bbc0b2",
		})
		is.NoError(err, "")
		_ = image.trimDigest()
		is.Equal("gcr.io/k8s-minikube/kicbase:v0.0.30", image.FullName())
		is.Equal("gcr.io/k8s-minikube/kicbase:v0.0.30@sha256:02c921df998f95e849058af14de7045efc3954d90320967418a0d1f182bbc0b2", image.opts.Name)
		is.Equal("v0.0.30", image.Tag)
		is.Equal("k8s-minikube/kicbase", image.Path)
		is.Equal("gcr.io", image.Domain)
		is.Equal("https://gcr.io/k8s-minikube/kicbase", image.HubLink)
		is.Equal("gcr.io/k8s-minikube/kicbase", image.Name())
		is.Equal("v0.0.30", image.Reference())
		is.Equal("gcr.io/k8s-minikube/kicbase:v0.0.30", image.String())
	})
}
