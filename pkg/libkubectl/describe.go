package libkubectl

import (
	"fmt"

	"k8s.io/apimachinery/pkg/api/meta"
	"k8s.io/cli-runtime/pkg/resource"
	describecmd "k8s.io/kubectl/pkg/cmd/describe"
	cmdutil "k8s.io/kubectl/pkg/cmd/util"
	"k8s.io/kubectl/pkg/describe"
)

// Describe returns the description of a resource
// name is the name of the resource, kind is the kind of the resource, and namespace is the namespace of the resource
// this is identical to running `kubectl describe <kind> <name> --namespace <namespace>`
func (c *Client) Describe(namespace, name, kind string) (string, error) {
	describeOptions := &describecmd.DescribeOptions{
		BuilderArgs: []string{kind, name},
		Describer: func(mapping *meta.RESTMapping) (describe.ResourceDescriber, error) {
			return describe.DescriberFn(c.factory, mapping)
		},
		FilenameOptions: &resource.FilenameOptions{},
		DescriberSettings: &describe.DescriberSettings{
			ShowEvents: true,
			ChunkSize:  cmdutil.DefaultChunkSize,
		},
		IOStreams:  c.streams,
		NewBuilder: c.factory.NewBuilder,
	}

	if namespace != "" {
		describeOptions.Namespace = namespace
	}

	if err := describeOptions.Run(); err != nil {
		return "", fmt.Errorf("error describing resources: %w", err)
	}

	return c.out.String(), nil
}
