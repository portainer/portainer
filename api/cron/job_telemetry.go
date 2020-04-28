package cron

import (
	"log"
	"runtime"

	"github.com/portainer/portainer/api"
)

// TelemetryJobRunner is used to run a TelemetryJob
type TelemetryJobRunner struct {
	schedule *portainer.Schedule
	context  *TelemetryJobContext
}

// TelemetryJobContext represents the context of execution of a TelemetryJob
type TelemetryJobContext struct {
	dataStore portainer.DataStore
}

// NewTelemetryJobContext returns a new context that can be used to execute a TelemetryJob
func NewTelemetryJobContext(dataStore portainer.DataStore) *TelemetryJobContext {
	return &TelemetryJobContext{
		dataStore: dataStore,
	}
}

// NewTelemetryJobRunner returns a new runner that can be scheduled
func NewTelemetryJobRunner(schedule *portainer.Schedule, context *TelemetryJobContext) *TelemetryJobRunner {
	return &TelemetryJobRunner{
		schedule: schedule,
		context:  context,
	}
}

// GetSchedule returns the schedule associated to the runner
func (runner *TelemetryJobRunner) GetSchedule() *portainer.Schedule {
	return runner.schedule
}

type (
	TelemetryData struct {
		Identifier         string                  `json:"Identifier"`
		Version            string                  `json:"Version"`
		Platform           string                  `json:"Platform"`
		Arch               string                  `json:"Arch"`
		AuthenticationMode string                  `json:"AuthenticationMode"`
		Endpoints          []EndpointTelemetryData `json:"Endpoints"`
		EndpointGroupCount int                     `json:"EndpointGroupCount"`
	}

	EndpointTelemetryData struct {
		Environment string                          `json:"Environment"`
		Agent       bool                            `json:"Agent"`
		Edge        bool                            `json:"Edge"`
		Docker      EndpointDockerTelemetryData     `json:"Docker"`
		Kubernetes  EndpointKubernetesTelemetryData `json:"Kubernetes"`
	}

	EndpointDockerTelemetryData struct {
		Version    string `json:"Version"`
		Swarm      bool   `json:"Swarm"`
		Containers int    `json:"Containers"`
		Images     int    `json:"Images"`
		Volumes    int    `json:"Volumes"`
		Services   int    `json:"Services"`
		Stacks     int    `json:"Stacks"`
		Nodes      int    `json:"Nodes"`
	}

	EndpointKubernetesTelemetryData struct {
		Version string `json:"Version"`
		Nodes   int    `json:"Nodes"`
	}
)

const AuthenticationMethodInternal = "internal"
const AuthenticationMethodLDAP = "ldap"
const AuthenticationMethodOAuth = "oauth"
const EndpointEnvironmentDocker = "docker"
const EndpointEnvironmentKubernetes = "kubernetes"

// Run triggers the execution of the schedule.
// It will compute the telemetry data using the data available inside the database and send it to the telemetry server.
func (runner *TelemetryJobRunner) Run() {
	go func() {
		telemetryData := &TelemetryData{
			Version:  portainer.APIVersion,
			Platform: runtime.GOOS,
			Arch:     runtime.GOARCH,
		}

		telemetryConfiguration, err := runner.context.dataStore.Telemetry().Telemetry()
		if err != nil {
			log.Printf("background schedule error (telemetry). Unable to retrieve telemetry info (err=%s)\n", err)
			return
		}

		telemetryData.Identifier = telemetryConfiguration.TelemetryID

		err = computeSettingsTelemetry(telemetryData, runner.context.dataStore)
		if err != nil {
			log.Printf("background schedule error (telemetry). Unable to compute settings telemetry (err=%s)\n", err)
			return
		}

		err = computeEndpointTelemetry(telemetryData, runner.context.dataStore)
		if err != nil {
			log.Printf("background schedule error (telemetry). Unable to compute endpoint telemetry (err=%s)\n", err)
			return
		}

		err = computeEndpointGroupTelemetry(telemetryData, runner.context.dataStore)
		if err != nil {
			log.Printf("background schedule error (telemetry). Unable to compute endpoint group telemetry (err=%s)\n", err)
			return
		}
	}()
}

func computeEndpointGroupTelemetry(telemetryData *TelemetryData, dataStore portainer.DataStore) error {
	endpointGroups, err := dataStore.EndpointGroup().EndpointGroups()
	if err != nil {
		return err
	}

	telemetryData.EndpointGroupCount = len(endpointGroups)

	return nil
}

func computeEndpointDockerTelemetry(endpoint *portainer.Endpoint) EndpointDockerTelemetryData {
	dockerTelemetryData := EndpointDockerTelemetryData{}

	if len(endpoint.Snapshots) > 0 {
		dockerTelemetryData.Version = endpoint.Snapshots[0].DockerVersion
		dockerTelemetryData.Swarm = endpoint.Snapshots[0].Swarm
		dockerTelemetryData.Containers = endpoint.Snapshots[0].HealthyContainerCount +
			endpoint.Snapshots[0].RunningContainerCount +
			endpoint.Snapshots[0].StoppedContainerCount +
			endpoint.Snapshots[0].UnhealthyContainerCount
		dockerTelemetryData.Images = endpoint.Snapshots[0].ImageCount
		dockerTelemetryData.Volumes = endpoint.Snapshots[0].VolumeCount
		dockerTelemetryData.Services = endpoint.Snapshots[0].ServiceCount
		dockerTelemetryData.Stacks = endpoint.Snapshots[0].StackCount
		dockerTelemetryData.Nodes = endpoint.Snapshots[0].NodeCount
	}

	return dockerTelemetryData
}

// TODO: add support for Kubernetes endpoints
func computeEndpointTelemetry(telemetryData *TelemetryData, dataStore portainer.DataStore) error {
	endpoints, err := dataStore.Endpoint().Endpoints()
	if err != nil {
		return err
	}

	endpointsTelemetry := make([]EndpointTelemetryData, 0)
	for _, endpoint := range endpoints {
		endpointTelemetry := EndpointTelemetryData{}

		switch endpoint.Type {
		case portainer.DockerEnvironment:
			endpointTelemetry.Environment = EndpointEnvironmentDocker
			endpointTelemetry.Agent = false
			endpointTelemetry.Edge = false
			endpointTelemetry.Docker = computeEndpointDockerTelemetry(&endpoint)
		case portainer.AgentOnDockerEnvironment:
			endpointTelemetry.Environment = EndpointEnvironmentDocker
			endpointTelemetry.Agent = true
			endpointTelemetry.Edge = false
			endpointTelemetry.Docker = computeEndpointDockerTelemetry(&endpoint)
		case portainer.EdgeAgentEnvironment:
			endpointTelemetry.Environment = EndpointEnvironmentDocker
			endpointTelemetry.Agent = true
			endpointTelemetry.Edge = true
			endpointTelemetry.Docker = computeEndpointDockerTelemetry(&endpoint)
		}

		endpointsTelemetry = append(endpointsTelemetry, endpointTelemetry)
	}

	telemetryData.Endpoints = endpointsTelemetry

	return nil
}

func computeSettingsTelemetry(telemetryData *TelemetryData, dataStore portainer.DataStore) error {
	settings, err := dataStore.Settings().Settings()
	if err != nil {
		return err
	}

	authenticationMethod := AuthenticationMethodInternal
	switch settings.AuthenticationMethod {
	case portainer.AuthenticationLDAP:
		authenticationMethod = AuthenticationMethodLDAP
	case portainer.AuthenticationOAuth:
		authenticationMethod = AuthenticationMethodOAuth
	}

	telemetryData.AuthenticationMode = authenticationMethod

	return nil
}
