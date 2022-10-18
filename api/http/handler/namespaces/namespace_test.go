package namespaces

import (
	"encoding/json"
	"fmt"
	portainer "github.com/portainer/portainer/api"
	"testing"
)

func Test_Namespace_struct(t *testing.T) {
	var containerId = "1fb8ad431f5dc6b06edd7a4274cad532daa74354767c8870a4f17c4bc1c7f9f6"

	namespace := &portainer.Namespace{
		Name:       "nginx",
		Containers: make(map[string]portainer.NamespaceContainer, 0),
	}

	body, err := json.MarshalIndent(namespace, "", "\t")
	if err != nil {
		panic(err)
	}
	fmt.Printf("1: %s\n", body)

	namespace2 := &portainer.Namespace{
		Name: "BisNav",
		Containers: map[string]portainer.NamespaceContainer{
			"111":       {Used: 1, EndpointID: 1},
			"222":       {Used: 1, EndpointID: 2},
			containerId: {Used: 0, EndpointID: 2},
		},
	}

	length := len(namespace2.Containers)

	fmt.Printf("namespaces map size %d\n", length)

	body2, err := json.MarshalIndent(namespace2, "", "\t")
	if err != nil {
		panic(err)
	}
	fmt.Printf("2: %s\n", body2)
}
