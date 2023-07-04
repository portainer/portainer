package composeplugin

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/portainer/portainer/pkg/libstack"
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
func getServiceStatus(service service) (libstack.Status, string) {
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
	case "exited", "dead":
		if service.ExitCode != 0 {
			return libstack.StatusError, fmt.Sprintf("service %s exited with code %d", service.Name, service.ExitCode)
		}

		return libstack.StatusRemoved, ""
	default:
		return libstack.StatusUnknown, ""
	}
}

func aggregateStatuses(services []service) (libstack.Status, string) {
	servicesCount := len(services)

	if servicesCount == 0 {
		log.Debug().
			Msg("no services found")

		return libstack.StatusRemoved, ""
	}

	statusCounts := make(map[libstack.Status]int)
	errorMessage := ""
	for _, service := range services {
		status, serviceError := getServiceStatus(service)
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
	case statusCounts[libstack.StatusRunning] == servicesCount:
		return libstack.StatusRunning, ""
	case statusCounts[libstack.StatusStopped] == servicesCount:
		return libstack.StatusStopped, ""
	case statusCounts[libstack.StatusRemoved] == servicesCount:
		return libstack.StatusRemoved, ""
	default:
		return libstack.StatusUnknown, ""
	}

}

func (wrapper *PluginWrapper) WaitForStatus(ctx context.Context, name string, status libstack.Status) (<-chan string, <-chan error) {
	resultCh := make(chan string)
	errCh := make(chan error)

	go func() {
		timeout := time.After(5 * time.Minute)
		for {
			output, err := wrapper.command(newCommand([]string{"ps", "-a", "--format", "json"}, nil), libstack.Options{
				ProjectName: name,
			})
			if len(output) == 0 {
				log.Debug().
					Str("project_name", name).
					Msg("no output from docker compose ps")
				continue
			}

			if err != nil {
				log.Debug().
					Str("project_name", name).
					Err(err).
					Msg("error from docker compose ps")
				continue
			}

			var services []service
			err = json.Unmarshal(output, &services)
			if err != nil {
				log.Debug().
					Str("project_name", name).
					Err(err).
					Msg("failed to parse docker compose output")
				continue
			}

			if len(services) == 0 && status == libstack.StatusRemoved {
				resultCh <- ""
				errCh <- nil
				return
			}

			aggregateStatus, errorMessage := aggregateStatuses(services)
			if aggregateStatus == status {
				resultCh <- ""
				errCh <- nil
				return
			}

			if errorMessage != "" {
				resultCh <- errorMessage
				return
			}

			select {
			case <-timeout:
				errCh <- fmt.Errorf("timeout waiting for status %s", status)
			case <-ctx.Done():
				errCh <- ctx.Err()
				return
			default:
			}

			time.Sleep(1 * time.Second)
		}
	}()

	return resultCh, errCh
}
