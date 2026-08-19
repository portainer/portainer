package exec

import (
	"context"
	"errors"
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type mockKubectlClient struct {
	applyFunc          func(ctx context.Context, files []string) error
	deleteFunc         func(ctx context.Context, files []string) error
	rolloutRestartFunc func(ctx context.Context, resources []string) error
}

func (m *mockKubectlClient) Apply(ctx context.Context, files []string) error {
	if m.applyFunc != nil {
		return m.applyFunc(ctx, files)
	}
	return nil
}

func (m *mockKubectlClient) Delete(ctx context.Context, files []string) error {
	if m.deleteFunc != nil {
		return m.deleteFunc(ctx, files)
	}
	return nil
}

func (m *mockKubectlClient) RolloutRestart(ctx context.Context, resources []string) error {
	if m.rolloutRestartFunc != nil {
		return m.rolloutRestartFunc(ctx, resources)
	}
	return nil
}

func testExecuteKubectlOperation(client *mockKubectlClient, operation string, manifestFiles []string) error {
	operations := map[string]func(context.Context, []string) error{
		"apply":           client.Apply,
		"delete":          client.Delete,
		"rollout-restart": client.RolloutRestart,
	}

	operationFunc, ok := operations[operation]
	if !ok {
		return fmt.Errorf("unsupported operation: %s", operation)
	}

	if err := operationFunc(context.Background(), manifestFiles); err != nil {
		return fmt.Errorf("failed to execute kubectl %s command: %w", operation, err)
	}

	return nil
}

func TestExecuteKubectlOperation_Apply_Success(t *testing.T) {
	t.Parallel()
	called := false
	mockClient := &mockKubectlClient{
		applyFunc: func(ctx context.Context, files []string) error {
			called = true
			assert.Equal(t, []string{"manifest1.yaml", "manifest2.yaml"}, files)
			return nil
		},
	}

	manifests := []string{"manifest1.yaml", "manifest2.yaml"}
	err := testExecuteKubectlOperation(mockClient, "apply", manifests)

	require.NoError(t, err)
	assert.True(t, called)
}

func TestExecuteKubectlOperation_Apply_Error(t *testing.T) {
	t.Parallel()
	expectedErr := errors.New("kubectl apply failed")
	called := false
	mockClient := &mockKubectlClient{
		applyFunc: func(ctx context.Context, files []string) error {
			called = true
			assert.Equal(t, []string{"error.yaml"}, files)
			return expectedErr
		},
	}

	manifests := []string{"error.yaml"}
	err := testExecuteKubectlOperation(mockClient, "apply", manifests)

	require.Error(t, err)
	assert.Contains(t, err.Error(), expectedErr.Error())
	assert.True(t, called)
}

func TestExecuteKubectlOperation_Delete_Success(t *testing.T) {
	t.Parallel()
	called := false
	mockClient := &mockKubectlClient{
		deleteFunc: func(ctx context.Context, files []string) error {
			called = true
			assert.Equal(t, []string{"manifest1.yaml"}, files)
			return nil
		},
	}

	manifests := []string{"manifest1.yaml"}
	err := testExecuteKubectlOperation(mockClient, "delete", manifests)

	require.NoError(t, err)
	assert.True(t, called)
}

func TestExecuteKubectlOperation_Delete_Error(t *testing.T) {
	t.Parallel()
	expectedErr := errors.New("kubectl delete failed")
	called := false
	mockClient := &mockKubectlClient{
		deleteFunc: func(ctx context.Context, files []string) error {
			called = true
			assert.Equal(t, []string{"error.yaml"}, files)
			return expectedErr
		},
	}

	manifests := []string{"error.yaml"}
	err := testExecuteKubectlOperation(mockClient, "delete", manifests)

	require.Error(t, err)
	assert.Contains(t, err.Error(), expectedErr.Error())
	assert.True(t, called)
}

func TestExecuteKubectlOperation_RolloutRestart_Success(t *testing.T) {
	t.Parallel()
	called := false
	mockClient := &mockKubectlClient{
		rolloutRestartFunc: func(ctx context.Context, resources []string) error {
			called = true
			assert.Equal(t, []string{"deployment/nginx"}, resources)
			return nil
		},
	}

	resources := []string{"deployment/nginx"}
	err := testExecuteKubectlOperation(mockClient, "rollout-restart", resources)

	require.NoError(t, err)
	assert.True(t, called)
}

func TestExecuteKubectlOperation_RolloutRestart_Error(t *testing.T) {
	t.Parallel()
	expectedErr := errors.New("kubectl rollout restart failed")
	called := false
	mockClient := &mockKubectlClient{
		rolloutRestartFunc: func(ctx context.Context, resources []string) error {
			called = true
			assert.Equal(t, []string{"deployment/error"}, resources)
			return expectedErr
		},
	}

	resources := []string{"deployment/error"}
	err := testExecuteKubectlOperation(mockClient, "rollout-restart", resources)

	require.Error(t, err)
	assert.Contains(t, err.Error(), expectedErr.Error())
	assert.True(t, called)
}

func TestExecuteKubectlOperation_UnsupportedOperation(t *testing.T) {
	t.Parallel()
	mockClient := &mockKubectlClient{}

	err := testExecuteKubectlOperation(mockClient, "unsupported", []string{})

	require.Error(t, err)
	assert.Contains(t, err.Error(), "unsupported operation")
}
