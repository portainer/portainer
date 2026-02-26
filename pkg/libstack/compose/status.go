package compose

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"time"

	"github.com/portainer/portainer/api/logs"
	"github.com/portainer/portainer/pkg/libstack"

	"github.com/compose-spec/compose-go/v2/types"
	"github.com/docker/cli/cli/command"
	"github.com/docker/compose/v2/pkg/api"
	"github.com/docker/docker/api/types/container"
	"github.com/pkg/errors"
	"github.com/rs/zerolog/log"
)

type publisher struct {
	URL           string
	TargetPort    int
	PublishedPort int
	Protocol      string
}

type service struct {
	ID         string
	Name       string
	Image      string
	Command    string
	Project    string
	Service    string
	Created    int64
	State      string
	Status     string
	Health     string
	ExitCode   int
	Publishers []publisher
}

// docker container state can be one of "created", "running", "paused", "restarting", "removing", "exited", or "dead"
func getServiceStatus(ctx context.Context, service service) (libstack.Status, string) {
	log.Debug().
		Str("service", service.Name).
		Str("state", service.State).
		Int("exitCode", service.ExitCode).
		Msg("getServiceStatus")

	switch service.State {
	case "created", "restarting", "paused":
		return libstack.StatusStarting, ""
	case "running":
		return libstack.StatusRunning, ""
	case "removing":
		return libstack.StatusRemoving, ""
	case "exited":
		if service.ExitCode == 0 {
			return libstack.StatusCompleted, ""
		}

		errorMessage, err := getContainerLogsTail(ctx, service)
		if err != nil {
			log.Error().
				Err(err).
				Str("service", service.Name).
				Msg("failed to get logs from container")
			errorMessage = fmt.Sprintf("service %s exited with code %d", service.Name, service.ExitCode)
		}

		return libstack.StatusError, errorMessage
	case "dead":
		if service.ExitCode == 0 {
			return libstack.StatusRemoved, ""
		}

		errorMessage, err := getContainerLogsTail(ctx, service)
		if err != nil {
			log.Error().
				Err(err).
				Str("service", service.Name).
				Msg("failed to get logs from container")
			errorMessage = fmt.Sprintf("service %s exited with code %d", service.Name, service.ExitCode)
		}

		return libstack.StatusError, errorMessage
	default:
		return libstack.StatusUnknown, ""
	}
}

func getContainerLogsTail(ctx context.Context, service service) (string, error) {
	var combinedOutput bytes.Buffer

	if err := withCli(ctx, libstack.Options{ProjectName: service.Project}, func(ctx context.Context, cli *command.DockerCli) error {
		out, err := cli.Client().ContainerLogs(ctx, service.Name, container.LogsOptions{
			ShowStdout: true,
			ShowStderr: true,
			Timestamps: true,
			Follow:     false,
			Tail:       "20",
		})
		if err != nil {
			return errors.Wrap(err, "unable to get logs from container")
		}
		defer logs.CloseAndLogErr(out)

		_, err = io.Copy(&combinedOutput, out)
		if err != nil {
			return errors.Wrap(err, "unable to read container logs")
		}

		return nil
	}); err != nil {
		return "", errors.Wrap(err, "unable to get logs from container")
	}

	return combinedOutput.String(), nil
}

func aggregateStatuses(ctx context.Context, services []service) (libstack.Status, string) {
	servicesCount := len(services)

	if servicesCount == 0 {
		log.Debug().
			Msg("no services found")

		return libstack.StatusRemoved, ""
	}

	statusCounts := make(map[libstack.Status]int)
	errorMessage := ""
	for _, service := range services {
		status, serviceError := getServiceStatus(ctx, service)
		if serviceError != "" {
			errorMessage = serviceError
		}
		statusCounts[status]++
	}

	log.Debug().
		Interface("statusCounts", statusCounts).
		Str("errorMessage", errorMessage).
		Msg("check_status")

	switch {
	case errorMessage != "":
		return libstack.StatusError, errorMessage
	case statusCounts[libstack.StatusStarting] > 0:
		return libstack.StatusStarting, ""
	case statusCounts[libstack.StatusRemoving] > 0:
		return libstack.StatusRemoving, ""
	case statusCounts[libstack.StatusCompleted] == servicesCount:
		return libstack.StatusCompleted, ""
	case statusCounts[libstack.StatusRunning]+statusCounts[libstack.StatusCompleted] == servicesCount:
		return libstack.StatusRunning, ""
	case statusCounts[libstack.StatusStopped] == servicesCount:
		return libstack.StatusStopped, ""
	case statusCounts[libstack.StatusRemoved] == servicesCount:
		return libstack.StatusRemoved, ""
	default:
		return libstack.StatusUnknown, ""
	}

}

func (c *ComposeDeployer) WaitForStatus(ctx context.Context, name string, status libstack.Status) libstack.WaitResult {
	waitResult := libstack.WaitResult{Status: status}

	for {
		if ctx.Err() != nil {
			waitResult.ErrorMsg = "failed to wait for status: " + ctx.Err().Error()

			return waitResult
		}

		time.Sleep(1 * time.Second)

		var containerSummaries []api.ContainerSummary

		if err := c.withComposeService(ctx, nil, libstack.Options{ProjectName: name}, func(composeService api.Compose, project *types.Project) error {
			var err error

			psCtx, cancelFunc := context.WithTimeout(context.Background(), time.Minute)
			defer cancelFunc()
			containerSummaries, err = composeService.Ps(psCtx, name, api.PsOptions{All: true})

			return err
		}); err != nil {
			log.Debug().
				Str("project_name", name).
				Err(err).
				Msg("error from docker compose ps")

			continue
		}

		services := serviceListFromContainerSummary(containerSummaries)

		if len(services) == 0 && status == libstack.StatusRemoved {
			return waitResult
		}

		aggregateStatus, errorMessage := aggregateStatuses(ctx, services)
		if aggregateStatus == status {
			return waitResult
		}

		if status == libstack.StatusRunning && aggregateStatus == libstack.StatusCompleted {
			waitResult.Status = libstack.StatusCompleted

			return waitResult
		}

		if errorMessage != "" {
			waitResult.ErrorMsg = errorMessage

			return waitResult
		}

		log.Debug().
			Str("project_name", name).
			Str("required_status", string(status)).
			Str("status", string(aggregateStatus)).
			Msg("waiting for status")
	}
}

func serviceListFromContainerSummary(containerSummaries []api.ContainerSummary) []service {
	var services []service

	for _, cs := range containerSummaries {
		var publishers []publisher

		for _, p := range cs.Publishers {
			publishers = append(publishers, publisher{
				URL:           p.URL,
				TargetPort:    p.TargetPort,
				PublishedPort: p.PublishedPort,
				Protocol:      p.Protocol,
			})
		}

		services = append(services, service{
			ID:         cs.ID,
			Name:       cs.Name,
			Image:      cs.Image,
			Command:    cs.Command,
			Project:    cs.Project,
			Service:    cs.Service,
			Created:    cs.Created,
			State:      cs.State,
			Status:     cs.Status,
			Health:     cs.Health,
			ExitCode:   cs.ExitCode,
			Publishers: publishers,
		})
	}

	return services
}
