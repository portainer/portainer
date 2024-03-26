package stacks

import (
	"sort"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/stretchr/testify/assert"
)

func TestFilterStacks(t *testing.T) {
	t.Run("filter stacks against particular endpoint and all orphaned stacks", func(t *testing.T) {
		stacks := []portainer.Stack{
			{ID: 1, EndpointID: 3, Name: "normal_stack", Type: portainer.DockerComposeStack},
			{ID: 2, EndpointID: 4, Name: "orphaned_stack", Type: portainer.DockerComposeStack},
			{ID: 3, EndpointID: 5, Name: "other_stack", Type: portainer.DockerComposeStack},
		}
		filters := &stackListOperationFilters{EndpointID: 3, IncludeOrphanedStacks: true}
		endpoints := []portainer.Endpoint{{ID: 3}, {ID: 5}}

		expectStacks := []portainer.Stack{{ID: 1}, {ID: 2}}
		actualStacks := filterStacks(stacks, filters, endpoints)

		isEqualStacks(t, expectStacks, actualStacks)
	})

	t.Run("filter unique stacks against particular endpoint and all orphaned stacks and an orphaned stack has the same name with normal stack", func(t *testing.T) {
		stacks := []portainer.Stack{
			{ID: 1, EndpointID: 3, Name: "normal_stack", Type: portainer.DockerComposeStack},
			{ID: 2, EndpointID: 4, Name: "orphaned_stack", Type: portainer.DockerComposeStack},
			{ID: 3, EndpointID: 5, Name: "other_stack", Type: portainer.DockerComposeStack},
			{ID: 4, EndpointID: 4, Name: "normal_stack", Type: portainer.DockerComposeStack},
		}
		filters := &stackListOperationFilters{EndpointID: 3, IncludeOrphanedStacks: true}
		endpoints := []portainer.Endpoint{{ID: 3}, {ID: 5}}

		expectStacks := []portainer.Stack{{ID: 1}, {ID: 2}}
		actualStacks := filterStacks(stacks, filters, endpoints)

		isEqualStacks(t, expectStacks, actualStacks)
	})

	t.Run("only filter stacks against particular endpoint and no orphaned stacks", func(t *testing.T) {
		stacks := []portainer.Stack{
			{ID: 1, EndpointID: 3, Name: "normal_stack", Type: portainer.DockerComposeStack},
			{ID: 2, EndpointID: 4, Name: "orphaned_stack", Type: portainer.DockerComposeStack},
			{ID: 3, EndpointID: 5, Name: "other_stack", Type: portainer.DockerComposeStack},
			{ID: 4, EndpointID: 4, Name: "normal_stack", Type: portainer.DockerComposeStack},
		}
		filters := &stackListOperationFilters{EndpointID: 3, IncludeOrphanedStacks: false}
		endpoints := []portainer.Endpoint{{ID: 3}, {ID: 5}}

		expectStacks := []portainer.Stack{{ID: 1}}
		actualStacks := filterStacks(stacks, filters, endpoints)

		isEqualStacks(t, expectStacks, actualStacks)
	})
}

func isEqualStacks(t *testing.T, expectStacks, actualStacks []portainer.Stack) {
	expectStackIDs := make([]int, len(expectStacks))
	for i, stack := range expectStacks {
		expectStackIDs[i] = int(stack.ID)
	}
	sort.Ints(expectStackIDs)

	actualStackIDs := make([]int, len(actualStacks))
	for i, stack := range actualStacks {
		actualStackIDs[i] = int(stack.ID)
	}
	sort.Ints(actualStackIDs)

	assert.Equal(t, expectStackIDs, actualStackIDs)
}
