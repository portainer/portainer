package libkubectl

import (
	"bytes"
	"context"
	"fmt"

	"k8s.io/kubectl/pkg/cmd/rollout"
	cmdutil "k8s.io/kubectl/pkg/cmd/util"
)

func (c *Client) RolloutRestart(ctx context.Context, manifests []string) (string, error) {
	buf := new(bytes.Buffer)

	var fatalErr error
	cmdutil.BehaviorOnFatal(func(msg string, code int) {
		fatalErr = newKubectlFatalError(code, msg)
	})
	defer cmdutil.DefaultBehaviorOnFatal()

	cmd := rollout.NewCmdRollout(c.factory, c.streams)
	args := []string{"restart"}
	args = append(args, resourcesToArgs(manifests)...)

	cmd.SetArgs(args)
	cmd.SetOut(buf)

	err := cmd.ExecuteContext(ctx)
	// check for the fatal error first so we don't return the error from the command execution
	if fatalErr != nil {
		return "", fatalErr
	}
	// if there is no fatal error, return the error from the command execution
	if err != nil {
		return "", fmt.Errorf("error restarting resources: %w", err)
	}

	return buf.String(), nil
}
