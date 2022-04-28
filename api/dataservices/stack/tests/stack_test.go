package tests

import (
	"testing"
	"time"

	"github.com/portainer/portainer/api/datastore"

	"github.com/gofrs/uuid"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/stretchr/testify/assert"
)

func newGuidString(t *testing.T) string {
	uuid, err := uuid.NewV4()
	assert.NoError(t, err)

	return uuid.String()
}

type stackBuilder struct {
	t     *testing.T
	count int
	store *datastore.Store
}

func TestService_StackByWebhookID(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping test in short mode. Normally takes ~1s to run.")
	}
	_, store, teardown := datastore.MustNewTestStore(true, true)
	defer teardown()

	b := stackBuilder{t: t, store: store}
	b.createNewStack(newGuidString(t))
	for i := 0; i < 10; i++ {
		b.createNewStack("")
	}
	webhookID := newGuidString(t)
	stack := b.createNewStack(webhookID)

	// can find a stack by webhook ID
	got, err := store.StackService.StackByWebhookID(webhookID)
	assert.NoError(t, err)
	assert.Equal(t, stack, *got)

	// returns nil and object not found error if there's no stack associated with the webhook
	got, err = store.StackService.StackByWebhookID(newGuidString(t))
	assert.Nil(t, got)
	assert.True(t, store.IsErrObjectNotFound(err))
}

func (b *stackBuilder) createNewStack(webhookID string) portainer.Stack {
	b.count++
	stack := portainer.Stack{
		ID:           portainer.StackID(b.count),
		Name:         "Name",
		Type:         portainer.DockerComposeStack,
		EndpointID:   2,
		EntryPoint:   filesystem.ComposeFileDefaultName,
		Env:          []portainer.Pair{{"Name1", "Value1"}},
		Status:       portainer.StackStatusActive,
		CreationDate: time.Now().Unix(),
		ProjectPath:  "/tmp/project",
		CreatedBy:    "test",
	}

	if webhookID == "" {
		if b.count%2 == 0 {
			stack.AutoUpdate = &portainer.StackAutoUpdate{
				Interval: "",
				Webhook:  "",
			}
		} // else keep AutoUpdate nil
	} else {
		stack.AutoUpdate = &portainer.StackAutoUpdate{Webhook: webhookID}
	}

	err := b.store.StackService.Create(&stack)
	assert.NoError(b.t, err)

	return stack
}

func Test_RefreshableStacks(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping test in short mode. Normally takes ~1s to run.")
	}
	_, store, teardown := datastore.MustNewTestStore(true, true)
	defer teardown()

	staticStack := portainer.Stack{ID: 1}
	stackWithWebhook := portainer.Stack{ID: 2, AutoUpdate: &portainer.StackAutoUpdate{Webhook: "webhook"}}
	refreshableStack := portainer.Stack{ID: 3, AutoUpdate: &portainer.StackAutoUpdate{Interval: "1m"}}

	for _, stack := range []*portainer.Stack{&staticStack, &stackWithWebhook, &refreshableStack} {
		err := store.Stack().Create(stack)
		assert.NoError(t, err)
	}

	stacks, err := store.Stack().RefreshableStacks()
	assert.NoError(t, err)
	assert.ElementsMatch(t, []portainer.Stack{refreshableStack}, stacks)
}
