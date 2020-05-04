package cron

import (
	"encoding/json"
	"log"
	"math"
	"math/rand"
	"os"
	"testing"
	"time"

	"github.com/gofrs/uuid"
)

// max number of instances
const instanceCount = 1500

// min date for initial report
var minInitialReportDate = time.Date(2020, 3, 0, 0, 0, 0, 0, time.UTC).Unix()

// max date for initial report
var maxInitialReportDate = time.Date(2020, 4, 0, 0, 0, 0, 0, time.UTC).Unix()

// edge compute
const edgeComputeMaxScheduleCount = 10

// endpoint
const endpointMaxCount = 50
const dockerContainerMaxCount = 250
const dockerImageMaxCount = 1000
const dockerVolumeMaxCount = 250
const dockerServiceMaxCount = 100
const dockerStackMaxCount = 30
const dockerNodeMaxCount = 9
const kubernetesNodeMaxCount = 15

// endpointgroup
const endpointGroupMaxCount = 25

// registry
const registryMaxCount = 10

// resourceControl
const resourceControlTypeMaxCount = 250

// settings
const snapshotIntervalMinValue = 5     // in seconds
const snapshotIntervalMaxValue = 86400 // in seconds == 24h

// stack
const stackMaxCount = 150

// tag
const tagMaxCount = 50

// team
const teamMaxCount = 20
const teamLeaderMaxCount = 7

// user
const userAdminMaxCount = 10
const userStandardMaxCount = 150

// webhooks
const webhookMaxCount = 25

var dockerVersions = []string{
	"18.03.1",
	"18.03.2",
	"18.03.3",
	"18.09.1",
	"18.09.2",
	"18.09.3",
	"19.03.1",
	"19.03.2",
	"19.03.3",
}

var kubernetesVersions = []string{
	"v1.15.1",
	"v1.16.1",
	"v1.16.2",
	"v1.17.1",
	"v1.17.2",
	"v1.18.1",
	"v1.18.2",
}

var registryTypes = []string{
	RegistryConfigurationTypeCustom,
	RegistryConfigurationTypeGitlab,
	RegistryConfigurationTypeQuay,
	RegistryConfigurationTypeAzure,
}

var portainerVersions = []string{
	"2.0.0",
	"2.0.1",
	"2.1.0",
	"2.1.1",
	"2.2.0",
}

var platforms = []string{
	"linux",
	"windows",
}

var archs = []string{
	"amd64",
	"arm",
	"arm64",
}

var authenticationModes = []string{
	AuthenticationMethodOAuth,
	AuthenticationMethodLDAP,
	AuthenticationMethodInternal,
}

func prettyPrint(i interface{}) string {
	s, _ := json.MarshalIndent(i, "", "\t")
	return string(s)
}

// need timestamp (random between two dates say 3month period with weekly telemetry report)
// 3 month period, weekly report = 3 * 4 = 12 reports per instance
// generate a random number of reports per instance between 1 and 12
// define a total number of instances = 3000 (3000 unique UUIDs)
// this random generator will generate between 3000 * 1 and 3000 * 12 reports

const fileName = "reports.json"

func TestGenerator(t *testing.T) {

	//rand.Seed(time.Now().UnixNano())

	file, err := os.OpenFile(fileName, os.O_APPEND|os.O_CREATE|os.O_WRONLY, os.ModePerm)
	if err != nil {
		t.Fatalf("an error occured: %s", err)
	}
	defer file.Close()

	for i := 0; i < instanceCount; i++ {
		token, err := uuid.NewV4()
		if err != nil {
			t.Fatalf("an error occured: %s", err)
		}

		instanceID := token.String()

		reportsPerInstance := rand.Intn(30) + 1
		log.Printf("Instance %s (#%d): generating %d reports", instanceID, i, reportsPerInstance)

		reportDateTime := utilsRandDateTime(minInitialReportDate, maxInitialReportDate)

		for j := 0; j < reportsPerInstance; j++ {
			report := generateRandomTelemetryData(instanceID, reportDateTime.Unix())

			//log.Printf("Report: %s", prettyPrint(report))

			data, err := json.Marshal(report)
			if err != nil {
				t.Fatalf("an error occured: %s", err)
			}

			_, err = file.Write(data)
			if err != nil {
				t.Fatalf("an error occured: %s", err)
			}

			_, err = file.WriteString("\n")
			if err != nil {
				t.Fatalf("an error occured: %s", err)
			}

			reportDateTime = reportDateTime.AddDate(0, 0, 1)
		}
	}
}

func utilsRandBool() bool {
	return rand.Int()%2 == 0
}

func utilsRandChoice(choices []string) string {
	randomIndex := rand.Intn(len(choices))
	return choices[randomIndex]
}

func utilsRandFloat(min, max float64) float64 {
	randFloat := min + rand.Float64()*(max-min)
	return math.Round(randFloat*100) / 100
}

func utilsRandDateTime(min, max int64) time.Time {
	delta := max - min
	sec := rand.Int63n(delta) + min
	return time.Unix(sec, 0)
}

func generateRandomTelemetryData(instanceID string, timestamp int64) *TelemetryData {
	telemetryData := &TelemetryData{
		Identifier:      instanceID,
		Timestamp:       timestamp,
		DockerHub:       randomDockerHubTelemetryData(),
		EdgeCompute:     randomEdgeComputeTelemetryData(),
		Endpoint:        randomEndpointTelemetryData(),
		EndpointGroup:   randomEndpointGroupTelemetryData(),
		Registry:        randomRegistryTelemetryData(),
		ResourceControl: randomResourceControlTelemetryData(),
		Runtime:         randomRuntimeTelemetryData(),
		Settings:        randomSettingsTelemetryData(),
		Stack:           randomStackTelemetryData(),
		Tag:             randomTagTelemetryData(),
		Team:            randomTeamTelemetryData(),
		User:            randomUserTelemetryData(),
		Webhook:         randomWebhookTelemetryData(),
	}

	return telemetryData
}

func randomDockerHubTelemetryData() DockerHubTelemetryData {
	return DockerHubTelemetryData{
		Authentication: utilsRandBool(),
	}
}

func randomEdgeComputeTelemetryData() EdgeComputeTelemetryData {
	scheduleCount := rand.Intn(edgeComputeMaxScheduleCount)
	recurringCount := 0
	if scheduleCount != 0 {
		recurringCount = rand.Intn(scheduleCount)
	}

	return EdgeComputeTelemetryData{
		Schedule: EdgeComputeScheduleTelemetryData{
			Count:     scheduleCount,
			Recurring: recurringCount,
		},
	}
}

func randomEndpointTelemetryData() EndpointTelemetryData {
	endpointCount := rand.Intn(endpointMaxCount)

	endpoints := make([]EndpointEnvironmentTelemetryData, 0)
	dockerEndpoints, KubernetesEndpoints := 0, 0
	for i := 0; i < endpointCount; i++ {
		endpointEnvTelemetry, dockerEnv := randomEndpointEnvironmentTelemetryData()

		if dockerEnv {
			dockerEndpoints++
		} else {
			KubernetesEndpoints++
		}

		endpoints = append(endpoints, endpointEnvTelemetry)
	}

	return EndpointTelemetryData{
		Count:                   endpointCount,
		Endpoints:               endpoints,
		DockerEndpointCount:     dockerEndpoints,
		KubernetesEndpointCount: KubernetesEndpoints,
	}
}

func randomEndpointEnvironmentTelemetryData() (EndpointEnvironmentTelemetryData, bool) {
	endpointEnvTelemetry := EndpointEnvironmentTelemetryData{
		Environment: EndpointEnvironmentDocker,
		Agent:       utilsRandBool(),
		Edge:        false,
	}

	dockerEnvironment := true

	if utilsRandBool() {
		endpointEnvTelemetry.Environment = EndpointEnvironmentKubernetes
	}

	if endpointEnvTelemetry.Agent {
		endpointEnvTelemetry.Edge = utilsRandBool()
	}

	if endpointEnvTelemetry.Environment == EndpointEnvironmentDocker {
		endpointEnvTelemetry.Docker = EndpointEnvironmentDockerTelemetryData{
			Version:    utilsRandChoice(dockerVersions),
			Swarm:      false,
			Containers: rand.Intn(dockerContainerMaxCount),
			Images:     rand.Intn(dockerImageMaxCount),
			Volumes:    rand.Intn(dockerVolumeMaxCount),
			Services:   0,
			Stacks:     rand.Intn(dockerStackMaxCount),
			Nodes:      1,
		}

		if utilsRandBool() {
			endpointEnvTelemetry.Docker.Swarm = true
			endpointEnvTelemetry.Docker.Services = rand.Intn(dockerServiceMaxCount)
			endpointEnvTelemetry.Docker.Nodes = rand.Intn(dockerNodeMaxCount) + 1
		}

	} else {
		dockerEnvironment = false
		endpointEnvTelemetry.Kubernetes = EndpointEnvironmentKubernetesTelemetryData{
			Version: utilsRandChoice(kubernetesVersions),
			Nodes:   rand.Intn(kubernetesNodeMaxCount) + 1,
		}
	}

	return endpointEnvTelemetry, dockerEnvironment
}

func randomEndpointGroupTelemetryData() EndpointGroupTelemetryData {
	return EndpointGroupTelemetryData{
		Count: rand.Intn(endpointGroupMaxCount),
	}
}

func randomRegistryTelemetryData() RegistryTelemetryData {
	registryCount := rand.Intn(registryMaxCount)

	registries := make([]RegistryConfigurationTelemetryData, 0)
	for i := 0; i < registryCount; i++ {

		registryConfTelemetry := RegistryConfigurationTelemetryData{
			Type: utilsRandChoice(registryTypes),
		}
		registries = append(registries, registryConfTelemetry)
	}

	return RegistryTelemetryData{
		Count:      registryCount,
		Registries: registries,
	}
}

func randomResourceControlTelemetryData() ResourceControlTelemetryData {
	rcTelemetry := ResourceControlTelemetryData{
		Containers: rand.Intn(resourceControlTypeMaxCount),
		Services:   rand.Intn(resourceControlTypeMaxCount),
		Volumes:    rand.Intn(resourceControlTypeMaxCount),
		Networks:   rand.Intn(resourceControlTypeMaxCount),
		Secrets:    rand.Intn(resourceControlTypeMaxCount),
		Configs:    rand.Intn(resourceControlTypeMaxCount),
		Stacks:     rand.Intn(resourceControlTypeMaxCount),
	}

	rcTelemetry.Count = rcTelemetry.Containers + rcTelemetry.Services + rcTelemetry.Volumes + rcTelemetry.Networks + rcTelemetry.Secrets + rcTelemetry.Configs + rcTelemetry.Stacks

	return rcTelemetry
}

func randomRuntimeTelemetryData() RuntimeTelemetryData {
	return RuntimeTelemetryData{
		PortainerVersion: utilsRandChoice(portainerVersions),
		Platform:         utilsRandChoice(platforms),
		Arch:             utilsRandChoice(archs),
	}
}

func randomSettingsTelemetryData() SettingsTelemetryData {
	return SettingsTelemetryData{
		AuthenticationMode:   utilsRandChoice(authenticationModes),
		UseLogoURL:           utilsRandBool(),
		UseBlackListedLabels: utilsRandBool(),
		Docker: SettingsDockerTelemetryData{
			RestrictBindMounts:     utilsRandBool(),
			RestrictPrivilegedMode: utilsRandBool(),
			RestrictVolumeBrowser:  utilsRandBool(),
		},
		HostManagement:   utilsRandBool(),
		SnapshotInterval: utilsRandFloat(snapshotIntervalMinValue, snapshotIntervalMaxValue),
	}
}

func randomStackTelemetryData() StackTelemetryData {
	stackTelemetry := StackTelemetryData{
		Standalone: rand.Intn(stackMaxCount),
		Swarm:      rand.Intn(stackMaxCount),
	}

	stackTelemetry.Count = stackTelemetry.Standalone + stackTelemetry.Swarm

	return stackTelemetry
}

func randomTagTelemetryData() TagTelemetryData {
	return TagTelemetryData{
		Count: rand.Intn(tagMaxCount),
	}
}

func randomTeamTelemetryData() TeamTelemetryData {
	return TeamTelemetryData{
		Count:           rand.Intn(teamMaxCount),
		TeamLeaderCount: rand.Intn(teamLeaderMaxCount),
	}
}

func randomUserTelemetryData() UserTelemetryData {
	ut := UserTelemetryData{
		AdminUserCount:    rand.Intn(userAdminMaxCount),
		StandardUserCount: rand.Intn(userStandardMaxCount),
	}

	ut.Count = ut.StandardUserCount + ut.AdminUserCount

	return ut
}

func randomWebhookTelemetryData() WebhookTelemetryData {
	return WebhookTelemetryData{
		Count: rand.Intn(webhookMaxCount),
	}
}
