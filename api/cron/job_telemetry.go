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
		Identifier       string                       `json:"Identifier"`
		TelemetryVersion int                          `json:"TelemetryVersion"`
		DockerHub        DockerHubTelemetryData       `json:"DockerHub"`
		EdgeCompute      EdgeComputeTelemetryData     `json:"EdgeCompute"`
		Endpoint         EndpointTelemetryData        `json:"Endpoint"`
		EndpointGroup    EndpointGroupTelemetryData   `json:"EndpointGroup"`
		Registry         RegistryTelemetryData        `json:"Registry"`
		ResourceControl  ResourceControlTelemetryData `json:"ResourceControl"`
		Runtime          RuntimeTelemetryData         `json:"Runtime"`
	}

	DockerHubTelemetryData struct {
		Authentication bool `json:"Authentication"`
	}

	EdgeComputeTelemetryData struct {
		Schedule EdgeComputeScheduleTelemetryData `json:"Schedule"`
	}

	EdgeComputeScheduleTelemetryData struct {
		Count     int `json:"Count"`
		Recurring int `json:"Recurring"`
	}

	EndpointTelemetryData struct {
		Count     int                                `json:"Count"`
		Endpoints []EndpointEnvironmentTelemetryData `json:"Endpoints"`
	}

	EndpointEnvironmentTelemetryData struct {
		Environment string                                     `json:"Environment"`
		Agent       bool                                       `json:"Agent"`
		Edge        bool                                       `json:"Edge"`
		Docker      EndpointEnvironmentDockerTelemetryData     `json:"Docker"`
		Kubernetes  EndpointEnvironmentKubernetesTelemetryData `json:"Kubernetes"`
	}

	EndpointEnvironmentDockerTelemetryData struct {
		Version    string `json:"Version"`
		Swarm      bool   `json:"Swarm"`
		Containers int    `json:"Containers"`
		Images     int    `json:"Images"`
		Volumes    int    `json:"Volumes"`
		Services   int    `json:"Services"`
		Stacks     int    `json:"Stacks"`
		Nodes      int    `json:"Nodes"`
	}

	EndpointEnvironmentKubernetesTelemetryData struct {
		Version string `json:"Version"`
		Nodes   int    `json:"Nodes"`
	}

	EndpointGroupTelemetryData struct {
		Count int `json:"Count"`
	}

	RegistryTelemetryData struct {
		Count      int                                  `json:"Count"`
		Registries []RegistryConfigurationTelemetryData `json:"Registries"`
	}

	RegistryConfigurationTelemetryData struct {
		Type string `json:"Type"`
	}

	ResourceControlTelemetryData struct {
		Count      int `json:"Count"`
		Containers int `json:"Containers"`
		Services   int `json:"Services"`
		Volumes    int `json:"Volumes"`
		Networks   int `json:"Networks"`
		Secrets    int `json:"Secrets"`
		Configs    int `json:"Config"`
		Stacks     int `json:"Stacks"`
	}

	RuntimeTelemetryData struct {
		PortainerVersion string `json:"PortainerVersion"`
		Platform         string `json:"Platform"`
		Arch             string `json:"Arch"`
	}
)

const TelemetryVersion = 1
const AuthenticationMethodInternal = "internal"
const AuthenticationMethodLDAP = "ldap"
const AuthenticationMethodOAuth = "oauth"
const EndpointEnvironmentDocker = "docker"
const EndpointEnvironmentKubernetes = "kubernetes"
const RegistryConfigurationTypeCustom = "custom"
const RegistryConfigurationTypeQuay = "quay"
const RegistryConfigurationTypeAzure = "azure"
const RegistryConfigurationTypeGitlab = "gitlab"

// Run triggers the execution of the schedule.
// It will compute the telemetry data using the data available inside the database and send it to the telemetry server.
func (runner *TelemetryJobRunner) Run() {
	go func() {
		telemetryData := &TelemetryData{
			TelemetryVersion: TelemetryVersion,
		}

		telemetryConfiguration, err := runner.context.dataStore.Telemetry().Telemetry()
		if err != nil {
			log.Printf("background schedule error (telemetry). Unable to retrieve telemetry info (err=%s)\n", err)
			return
		}

		telemetryData.Identifier = telemetryConfiguration.TelemetryID

		err = computeDockerHubTelemetry(telemetryData, runner.context.dataStore)
		if err != nil {
			log.Printf("background schedule error (telemetry). Unable to compute dockerhub telemetry (err=%s)\n", err)
			return
		}

		err = computeEdgeComputeTelemetry(telemetryData, runner.context.dataStore)
		if err != nil {
			log.Printf("background schedule error (telemetry). Unable to compute Edge compute telemetry (err=%s)\n", err)
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

		err = computeRegistryTelemetry(telemetryData, runner.context.dataStore)
		if err != nil {
			log.Printf("background schedule error (telemetry). Unable to compute registry telemetry (err=%s)\n", err)
			return
		}

		err = computeResourceControlTelemetry(telemetryData, runner.context.dataStore)
		if err != nil {
			log.Printf("background schedule error (telemetry). Unable to compute resource control telemetry (err=%s)\n", err)
			return
		}

		computeRuntimeTelemetry(telemetryData)
	}()
}

// TODO: add telemetry for Edge compute features (Edge groups, Edge stacks)
func computeEdgeComputeTelemetry(telemetryData *TelemetryData, dataStore portainer.DataStore) error {
	telemetryData.EdgeCompute = EdgeComputeTelemetryData{}

	schedules, err := dataStore.Schedule().Schedules()
	if err != nil {
		return err
	}

	scheduleTelemetryData := EdgeComputeScheduleTelemetryData{
		Count:     len(schedules),
		Recurring: 0,
	}

	for _, schedule := range schedules {
		if schedule.JobType == portainer.ScriptExecutionJobType && schedule.Recurring {
			scheduleTelemetryData.Recurring++
		}
	}

	telemetryData.EdgeCompute.Schedule = scheduleTelemetryData

	return nil
}

func computeDockerHubTelemetry(telemetryData *TelemetryData, dataStore portainer.DataStore) error {
	dockerhub, err := dataStore.DockerHub().DockerHub()
	if err != nil {
		return err
	}

	telemetryData.DockerHub = DockerHubTelemetryData{
		Authentication: dockerhub.Authentication,
	}

	return nil
}

// TODO: add telemetry for Kubernetes endpoints
func computeEndpointTelemetry(telemetryData *TelemetryData, dataStore portainer.DataStore) error {
	endpoints, err := dataStore.Endpoint().Endpoints()
	if err != nil {
		return err
	}

	endpointsTelemetry := make([]EndpointEnvironmentTelemetryData, 0)
	for _, endpoint := range endpoints {
		endpointTelemetry := EndpointEnvironmentTelemetryData{}

		switch endpoint.Type {
		case portainer.DockerEnvironment:
			endpointTelemetry.Environment = EndpointEnvironmentDocker
			endpointTelemetry.Agent = false
			endpointTelemetry.Edge = false
			endpointTelemetry.Docker = computeEndpointEnvironmentDockerTelemetry(&endpoint)
		case portainer.AgentOnDockerEnvironment:
			endpointTelemetry.Environment = EndpointEnvironmentDocker
			endpointTelemetry.Agent = true
			endpointTelemetry.Edge = false
			endpointTelemetry.Docker = computeEndpointEnvironmentDockerTelemetry(&endpoint)
		case portainer.EdgeAgentEnvironment:
			endpointTelemetry.Environment = EndpointEnvironmentDocker
			endpointTelemetry.Agent = true
			endpointTelemetry.Edge = true
			endpointTelemetry.Docker = computeEndpointEnvironmentDockerTelemetry(&endpoint)
		}

		endpointsTelemetry = append(endpointsTelemetry, endpointTelemetry)
	}

	telemetryData.Endpoint = EndpointTelemetryData{
		Count:     len(endpoints),
		Endpoints: endpointsTelemetry,
	}

	return nil
}

func computeEndpointEnvironmentDockerTelemetry(endpoint *portainer.Endpoint) EndpointEnvironmentDockerTelemetryData {
	dockerTelemetryData := EndpointEnvironmentDockerTelemetryData{}

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

func computeEndpointGroupTelemetry(telemetryData *TelemetryData, dataStore portainer.DataStore) error {
	endpointGroups, err := dataStore.EndpointGroup().EndpointGroups()
	if err != nil {
		return err
	}

	telemetryData.EndpointGroup = EndpointGroupTelemetryData{
		Count: len(endpointGroups),
	}

	return nil
}

func computeRegistryTelemetry(telemetryData *TelemetryData, dataStore portainer.DataStore) error {
	registries, err := dataStore.Registry().Registries()
	if err != nil {
		return err
	}

	registriesTelemetry := make([]RegistryConfigurationTelemetryData, 0)
	for _, registry := range registries {
		registryTelemetry := RegistryConfigurationTelemetryData{
			Type: RegistryConfigurationTypeCustom,
		}

		switch registry.Type {
		case portainer.AzureRegistry:
			registryTelemetry.Type = RegistryConfigurationTypeAzure
		case portainer.QuayRegistry:
			registryTelemetry.Type = RegistryConfigurationTypeQuay
		case portainer.GitlabRegistry:
			registryTelemetry.Type = RegistryConfigurationTypeGitlab
		}

		registriesTelemetry = append(registriesTelemetry, registryTelemetry)
	}

	telemetryData.Registry = RegistryTelemetryData{
		Count:      len(registries),
		Registries: registriesTelemetry,
	}

	return nil
}

func computeResourceControlTelemetry(telemetryData *TelemetryData, dataStore portainer.DataStore) error {
	resourceControls, err := dataStore.ResourceControl().ResourceControls()
	if err != nil {
		return err
	}

	telemetryData.ResourceControl = ResourceControlTelemetryData{
		Count:      len(resourceControls),
		Containers: 0,
		Services:   0,
		Volumes:    0,
		Networks:   0,
		Secrets:    0,
		Configs:    0,
		Stacks:     0,
	}

	for _, resourceControl := range resourceControls {
		switch resourceControl.Type {
		case portainer.ContainerResourceControl:
			telemetryData.ResourceControl.Containers++
		case portainer.ServiceResourceControl:
			telemetryData.ResourceControl.Services++
		case portainer.VolumeResourceControl:
			telemetryData.ResourceControl.Volumes++
		case portainer.NetworkResourceControl:
			telemetryData.ResourceControl.Networks++
		case portainer.SecretResourceControl:
			telemetryData.ResourceControl.Secrets++
		case portainer.ConfigResourceControl:
			telemetryData.ResourceControl.Configs++
		case portainer.StackResourceControl:
			telemetryData.ResourceControl.Stacks++
		}
	}

	return nil
}

func computeRuntimeTelemetry(telemetryData *TelemetryData) {
	telemetryData.Runtime = RuntimeTelemetryData{
		PortainerVersion: portainer.APIVersion,
		Platform:         runtime.GOOS,
		Arch:             runtime.GOARCH,
	}
}

func computeSettingsTelemetry(telemetryData *TelemetryData, dataStore portainer.DataStore) error {
	_, err := dataStore.Settings().Settings()
	if err != nil {
		return err
	}

	return nil
}
