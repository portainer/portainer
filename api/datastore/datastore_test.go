package datastore

import (
	"fmt"
	"runtime"
	"strings"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/chisel"
	"github.com/portainer/portainer/api/crypto"

	"github.com/dchest/uniuri"
	"github.com/pkg/errors"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const (
	adminUsername                       = "admin"
	adminPassword                       = "password"
	standardUsername                    = "standard"
	standardPassword                    = "password"
	agentOnDockerEnvironmentUrl         = "tcp://192.168.167.207:30775"
	edgeAgentOnKubernetesEnvironmentUrl = "tcp://192.168.167.207"
	kubernetesLocalEnvironmentUrl       = "https://kubernetes.default.svc"
)

// TestStoreFull an eventually comprehensive set of tests for the Store.
// The idea is what we write to the store, we should read back.
func TestStoreFull(t *testing.T) {
	_, store := MustNewTestStore(t, true, true)

	testCases := map[string]func(t *testing.T){
		"User Accounts":    store.testUserAccounts,
		"Environments":     store.testEnvironments,
		"Settings":         store.testSettings,
		"SSL Settings":     store.testSSLSettings,
		"Tunnel Server":    store.testTunnelServer,
		"Custom Templates": store.testCustomTemplates,
		"Registries":       store.testRegistries,
		"Resource Control": store.testResourceControl,
		"Schedules":        store.testSchedules,
		"Tags":             store.testTags,
	}

	for name, test := range testCases {
		t.Run(name, test)
	}
}

func (store *Store) testEnvironments(t *testing.T) {
	id := store.CreateEndpoint(t, "local", portainer.KubernetesLocalEnvironment, "", true)
	store.CreateEndpointRelation(t, id)

	id = store.CreateEndpoint(t, "agent", portainer.AgentOnDockerEnvironment, agentOnDockerEnvironmentUrl, true)
	store.CreateEndpointRelation(t, id)

	id = store.CreateEndpoint(t, "edge", portainer.EdgeAgentOnKubernetesEnvironment, edgeAgentOnKubernetesEnvironmentUrl, true)
	store.CreateEndpointRelation(t, id)
}

func newEndpoint(endpointType portainer.EndpointType, id portainer.EndpointID, name, URL string, TLS bool) *portainer.Endpoint {
	endpoint := &portainer.Endpoint{
		ID:        id,
		Name:      name,
		URL:       URL,
		Type:      endpointType,
		GroupID:   portainer.EndpointGroupID(1),
		PublicURL: "",
		TLSConfig: portainer.TLSConfiguration{
			TLS: false,
		},
		UserAccessPolicies: portainer.UserAccessPolicies{},
		TeamAccessPolicies: portainer.TeamAccessPolicies{},
		TagIDs:             []portainer.TagID{},
		Status:             portainer.EndpointStatusUp,
		Snapshots:          []portainer.DockerSnapshot{},
		Kubernetes:         portainer.KubernetesDefault(),
	}

	if TLS {
		endpoint.TLSConfig = portainer.TLSConfiguration{
			TLS:           true,
			TLSSkipVerify: true,
		}
	}

	return endpoint
}

func setEndpointAuthorizations(endpoint *portainer.Endpoint) {
	endpoint.SecuritySettings = portainer.DefaultEndpointSecuritySettings()
}

func (store *Store) CreateEndpoint(t *testing.T, name string, endpointType portainer.EndpointType, URL string, tls bool) portainer.EndpointID {
	is := assert.New(t)

	var expectedEndpoint *portainer.Endpoint
	id := portainer.EndpointID(store.Endpoint().GetNextIdentifier())

	switch endpointType {
	case portainer.DockerEnvironment:
		if URL == "" {
			URL = "unix:///var/run/docker.sock"
			if runtime.GOOS == "windows" {
				URL = "npipe:////./pipe/docker_engine"
			}
		}
		expectedEndpoint = newEndpoint(endpointType, id, name, URL, tls)

	case portainer.AgentOnDockerEnvironment:
		expectedEndpoint = newEndpoint(endpointType, id, name, URL, tls)

	case portainer.AgentOnKubernetesEnvironment:
		URL = strings.TrimPrefix(URL, "tcp://")
		expectedEndpoint = newEndpoint(endpointType, id, name, URL, tls)

	case portainer.EdgeAgentOnKubernetesEnvironment:
		cs := chisel.NewService(store, nil, nil)
		expectedEndpoint = newEndpoint(endpointType, id, name, URL, tls)
		edgeKey := cs.GenerateEdgeKey(URL, "", int(id))
		expectedEndpoint.EdgeKey = edgeKey
		store.testTunnelServer(t)

	case portainer.KubernetesLocalEnvironment:
		if URL == "" {
			URL = kubernetesLocalEnvironmentUrl
		}
		expectedEndpoint = newEndpoint(endpointType, id, name, URL, tls)
	}

	setEndpointAuthorizations(expectedEndpoint)

	err := store.Endpoint().Create(expectedEndpoint)
	require.NoError(t, err)

	endpoint, err := store.Endpoint().Endpoint(id)
	require.NoError(t, err, "Endpoint() should not return an error")
	is.Equal(expectedEndpoint, endpoint, "endpoint should be the same")

	return endpoint.ID
}

func (store *Store) CreateEndpointRelation(t *testing.T, id portainer.EndpointID) {
	relation := &portainer.EndpointRelation{
		EndpointID: id,
		EdgeStacks: map[portainer.EdgeStackID]bool{},
	}

	err := store.EndpointRelation().Create(relation)
	require.NoError(t, err)
}

func (store *Store) testSSLSettings(t *testing.T) {
	is := assert.New(t)
	ssl := &portainer.SSLSettings{
		CertPath:    "/data/certs/cert.pem",
		HTTPEnabled: true,
		KeyPath:     "/data/certs/key.pem",
		SelfSigned:  true,
	}

	err := store.SSLSettings().UpdateSettings(ssl)
	require.NoError(t, err)

	settings, err := store.SSLSettings().Settings()
	require.NoError(t, err, "Get sslsettings should succeed")
	is.Equal(ssl, settings, "Stored SSLSettings should be the same as what is read out")
}

func (store *Store) testTunnelServer(t *testing.T) {
	is := assert.New(t)
	expectPrivateKeySeed := uniuri.NewLen(16)

	err := store.TunnelServer().UpdateInfo(&portainer.TunnelServerInfo{PrivateKeySeed: expectPrivateKeySeed})
	require.NoError(t, err, "UpdateInfo should have succeeded")

	serverInfo, err := store.TunnelServer().Info()
	require.NoError(t, err, "Info should have succeeded")

	is.Equal(expectPrivateKeySeed, serverInfo.PrivateKeySeed, "hashed passwords should not differ")
}

// add users, read them back and check the details are unchanged
func (store *Store) testUserAccounts(t *testing.T) {
	err := store.createAccount(adminUsername, adminPassword, portainer.AdministratorRole)
	require.NoError(t, err, "CreateAccount should succeed")

	err = store.checkAccount(adminUsername, adminPassword, portainer.AdministratorRole)
	require.NoError(t, err, "Account failure")

	err = store.createAccount(standardUsername, standardPassword, portainer.StandardUserRole)
	require.NoError(t, err, "CreateAccount should succeed")

	err = store.checkAccount(standardUsername, standardPassword, portainer.StandardUserRole)
	require.NoError(t, err, "Account failure")
}

// create an account with the provided details
func (store *Store) createAccount(username, password string, role portainer.UserRole) error {
	var err error
	user := &portainer.User{Username: username, Role: role}

	// encrypt the password
	cs := crypto.Service{}
	user.Password, err = cs.Hash(password)
	if err != nil {
		return err
	}

	return store.User().Create(user)
}

func (store *Store) checkAccount(username, expectPassword string, expectRole portainer.UserRole) error {
	// Read the account for username.  Check password and role is what we expect

	user, err := store.User().UserByUsername(username)
	if err != nil {
		return errors.Wrap(err, "failed to find user")
	}

	if user.Username != username || user.Role != expectRole {
		return fmt.Errorf("%s user details do not match", user.Username)
	}

	// Check the password
	cs := crypto.Service{}
	if cs.CompareHashAndData(user.Password, expectPassword) != nil {
		return fmt.Errorf("%s user password hash failure", user.Username)
	}

	return nil
}

func (store *Store) testSettings(t *testing.T) {
	is := assert.New(t)

	// since many settings are default and basically nil, I'm going to update some and read them back
	expectedSettings, err := store.Settings().Settings()
	require.NoError(t, err, "Settings() should not return an error")
	expectedSettings.TemplatesURL = "http://portainer.io/application-templates"
	expectedSettings.HelmRepositoryURL = "http://portainer.io/helm-repository"
	expectedSettings.EdgeAgentCheckinInterval = 60
	expectedSettings.AuthenticationMethod = portainer.AuthenticationLDAP
	expectedSettings.LDAPSettings = portainer.LDAPSettings{
		AnonymousMode:   true,
		StartTLS:        true,
		AutoCreateUsers: true,
		Password:        "random",
	}
	expectedSettings.SnapshotInterval = "10m"

	err = store.Settings().UpdateSettings(expectedSettings)
	require.NoError(t, err, "UpdateSettings() should succeed")

	settings, err := store.Settings().Settings()
	require.NoError(t, err, "Settings() should not return an error")
	is.Equal(expectedSettings, settings, "stored settings should match")
}

func (store *Store) testCustomTemplates(t *testing.T) {
	is := assert.New(t)

	customTemplate := store.CustomTemplate()
	is.NotNil(customTemplate, "customTemplate Service shouldn't be nil")

	expectedTemplate := &portainer.CustomTemplate{
		ID:              portainer.CustomTemplateID(customTemplate.GetNextIdentifier()),
		Title:           "Custom Title",
		Description:     "Custom Template Description",
		ProjectPath:     "/data/custom_template/1",
		Note:            "A note about this custom template",
		EntryPoint:      "docker-compose.yaml",
		CreatedByUserID: 10,
	}

	err := customTemplate.Create(expectedTemplate)
	require.NoError(t, err)

	actualTemplate, err := customTemplate.Read(expectedTemplate.ID)
	require.NoError(t, err, "CustomTemplate should not return an error")
	is.Equal(expectedTemplate, actualTemplate, "expected and actual template do not match")
}

func (store *Store) testRegistries(t *testing.T) {
	is := assert.New(t)

	regService := store.RegistryService
	is.NotNil(regService, "RegistryService shouldn't be nil")

	reg1 := &portainer.Registry{
		ID:   1,
		Type: portainer.DockerHubRegistry,
		Name: "Dockerhub Registry Test",
	}

	reg2 := &portainer.Registry{
		ID:   2,
		Type: portainer.GitlabRegistry,
		Name: "Gitlab Registry Test",
		Gitlab: portainer.GitlabRegistryData{
			ProjectID:   12345,
			InstanceURL: "http://gitlab.com/12345",
			ProjectPath: "mytestproject",
		},
	}

	err := regService.Create(reg1)
	require.NoError(t, err)

	err = regService.Create(reg2)
	require.NoError(t, err)

	actualReg1, err := regService.Read(reg1.ID)
	require.NoError(t, err)
	is.Equal(reg1, actualReg1, "registries differ")

	actualReg2, err := regService.Read(reg2.ID)
	require.NoError(t, err)
	is.Equal(reg2, actualReg2, "registries differ")
}

func (store *Store) testResourceControl(t *testing.T) {
	// is := assert.New(t)
	// resControl := store.ResourceControl()
	// ctrl := &portainer.ResourceControl{
	// }
	// resControl().Create()
}

func (store *Store) testSchedules(t *testing.T) {
	is := assert.New(t)

	schedule := store.ScheduleService
	s := &portainer.Schedule{
		ID:             portainer.ScheduleID(schedule.GetNextIdentifier()),
		Name:           "My Custom Schedule 1",
		CronExpression: "*/5 * * * * portainer /bin/sh -c echo 'hello world'",
	}

	err := schedule.CreateSchedule(s)
	require.NoError(t, err, "CreateSchedule should succeed")

	actual, err := schedule.Schedule(s.ID)
	require.NoError(t, err, "schedule should be found")
	is.Equal(s, actual, "schedules differ")
}

func (store *Store) testTags(t *testing.T) {
	is := assert.New(t)

	tags := store.TagService

	tag1 := &portainer.Tag{
		ID:   1,
		Name: "Tag 1",
	}

	tag2 := &portainer.Tag{
		ID:   2,
		Name: "Tag 1",
	}

	err := tags.Create(tag1)
	require.NoError(t, err, "Tags.Create should succeed")

	err = tags.Create(tag2)
	require.NoError(t, err, "Tags.Create should succeed")

	actual, err := tags.Read(tag1.ID)
	require.NoError(t, err, "tag1 should be found")
	is.Equal(tag1, actual, "tags differ")

	actual, err = tags.Read(tag2.ID)
	require.NoError(t, err, "tag2 should be found")
	is.Equal(tag2, actual, "tags differ")
}
