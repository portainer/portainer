package datastore

import (
	"fmt"
	"runtime"
	"strings"
	"testing"

	"github.com/dchest/uniuri"
	"github.com/pkg/errors"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/chisel"
	"github.com/portainer/portainer/api/crypto"
	"github.com/stretchr/testify/assert"
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
	_, store, teardown := MustNewTestStore(true, true)
	defer teardown()

	testCases := map[string]func(t *testing.T){
		"User Accounts": func(t *testing.T) {
			store.testUserAccounts(t)
		},
		"Environments": func(t *testing.T) {
			store.testEnvironments(t)
		},
		"Settings": func(t *testing.T) {
			store.testSettings(t)
		},
		"SSL Settings": func(t *testing.T) {
			store.testSSLSettings(t)
		},
		"Tunnel Server": func(t *testing.T) {
			store.testTunnelServer(t)
		},
		"Custom Templates": func(t *testing.T) {
			store.testCustomTemplates(t)
		},
		"Registries": func(t *testing.T) {
			store.testRegistries(t)
		},
		"Resource Control": func(t *testing.T) {
			store.testResourceControl(t)
		},
		"Schedules": func(t *testing.T) {
			store.testSchedules(t)
		},
		"Tags": func(t *testing.T) {
			store.testTags(t)
		},

		// "Test Title": func(t *testing.T) {
		// },
	}

	for name, test := range testCases {
		t.Run(name, test)
	}

}

func (store *Store) testEnvironments(t *testing.T) {
	id := store.CreateEndpoint(t, "local", portainer.KubernetesLocalEnvironment, "", true)
	store.CreateEndpointRelation(id)

	id = store.CreateEndpoint(t, "agent", portainer.AgentOnDockerEnvironment, agentOnDockerEnvironmentUrl, true)
	store.CreateEndpointRelation(id)

	id = store.CreateEndpoint(t, "edge", portainer.EdgeAgentOnKubernetesEnvironment, edgeAgentOnKubernetesEnvironmentUrl, true)
	store.CreateEndpointRelation(id)
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
	endpoint.SecuritySettings = portainer.EndpointSecuritySettings{
		AllowVolumeBrowserForRegularUsers: false,
		EnableHostManagementFeatures:      false,

		AllowSysctlSettingForRegularUsers:         true,
		AllowBindMountsForRegularUsers:            true,
		AllowPrivilegedModeForRegularUsers:        true,
		AllowHostNamespaceForRegularUsers:         true,
		AllowContainerCapabilitiesForRegularUsers: true,
		AllowDeviceMappingForRegularUsers:         true,
		AllowStackManagementForRegularUsers:       true,
	}
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
		cs := chisel.NewService(store, nil)
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
	store.Endpoint().Create(expectedEndpoint)

	endpoint, err := store.Endpoint().Endpoint(id)
	is.NoError(err, "Endpoint() should not return an error")
	is.Equal(expectedEndpoint, endpoint, "endpoint should be the same")

	return endpoint.ID
}

func (store *Store) CreateEndpointRelation(id portainer.EndpointID) {
	relation := &portainer.EndpointRelation{
		EndpointID: id,
		EdgeStacks: map[portainer.EdgeStackID]bool{},
	}

	store.EndpointRelation().Create(relation)
}

func (store *Store) testSSLSettings(t *testing.T) {
	is := assert.New(t)
	ssl := &portainer.SSLSettings{
		CertPath:    "/data/certs/cert.pem",
		HTTPEnabled: true,
		KeyPath:     "/data/certs/key.pem",
		SelfSigned:  true,
	}

	store.SSLSettings().UpdateSettings(ssl)

	settings, err := store.SSLSettings().Settings()
	is.NoError(err, "Get sslsettings should succeed")
	is.Equal(ssl, settings, "Stored SSLSettings should be the same as what is read out")
}

func (store *Store) testTunnelServer(t *testing.T) {
	is := assert.New(t)
	expectPrivateKeySeed := uniuri.NewLen(16)

	err := store.TunnelServer().UpdateInfo(&portainer.TunnelServerInfo{PrivateKeySeed: expectPrivateKeySeed})
	is.NoError(err, "UpdateInfo should have succeeded")

	serverInfo, err := store.TunnelServer().Info()
	is.NoError(err, "Info should have succeeded")

	is.Equal(expectPrivateKeySeed, serverInfo.PrivateKeySeed, "hashed passwords should not differ")
}

// add users, read them back and check the details are unchanged
func (store *Store) testUserAccounts(t *testing.T) {
	is := assert.New(t)

	err := store.createAccount(adminUsername, adminPassword, portainer.AdministratorRole)
	is.NoError(err, "CreateAccount should succeed")
	store.checkAccount(adminUsername, adminPassword, portainer.AdministratorRole)
	is.NoError(err, "Account failure")

	err = store.createAccount(standardUsername, standardPassword, portainer.StandardUserRole)
	is.NoError(err, "CreateAccount should succeed")
	store.checkAccount(standardUsername, standardPassword, portainer.StandardUserRole)
	is.NoError(err, "Account failure")
}

// create an account with the provided details
func (store *Store) createAccount(username, password string, role portainer.UserRole) error {
	var err error
	user := &portainer.User{Username: username, Role: role}

	// encrypt the password
	cs := &crypto.Service{}
	user.Password, err = cs.Hash(password)
	if err != nil {
		return err
	}

	err = store.User().Create(user)
	if err != nil {
		return err
	}

	return nil
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
	cs := &crypto.Service{}
	expectPasswordHash, err := cs.Hash(expectPassword)
	if err != nil {
		return errors.Wrap(err, "hash failed")
	}

	if user.Password != expectPasswordHash {
		return fmt.Errorf("%s user password hash failure", user.Username)
	}

	return nil
}

func (store *Store) testSettings(t *testing.T) {
	is := assert.New(t)

	// since many settings are default and basically nil, I'm going to update some and read them back
	expectedSettings, err := store.Settings().Settings()
	is.NoError(err, "Settings() should not return an error")
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
	is.NoError(err, "UpdateSettings() should succeed")

	settings, err := store.Settings().Settings()
	is.NoError(err, "Settings() should not return an error")
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

	customTemplate.Create(expectedTemplate)

	actualTemplate, err := customTemplate.CustomTemplate(expectedTemplate.ID)
	is.NoError(err, "CustomTemplate should not return an error")
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
	is.NoError(err)

	err = regService.Create(reg2)
	is.NoError(err)

	actualReg1, err := regService.Registry(reg1.ID)
	is.NoError(err)
	is.Equal(reg1, actualReg1, "registries differ")

	actualReg2, err := regService.Registry(reg2.ID)
	is.NoError(err)
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
	is.NoError(err, "CreateSchedule should succeed")

	actual, err := schedule.Schedule(s.ID)
	is.NoError(err, "schedule should be found")
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
	is.NoError(err, "Tags.Create should succeed")

	err = tags.Create(tag2)
	is.NoError(err, "Tags.Create should succeed")

	actual, err := tags.Tag(tag1.ID)
	is.NoError(err, "tag1 should be found")
	is.Equal(tag1, actual, "tags differ")

	actual, err = tags.Tag(tag2.ID)
	is.NoError(err, "tag2 should be found")
	is.Equal(tag2, actual, "tags differ")
}
