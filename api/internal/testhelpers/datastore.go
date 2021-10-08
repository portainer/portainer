package testhelpers

import (
	"io"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt/errors"
	"github.com/portainer/portainer/api/datastore"
)

type testDatastore struct {
	customTemplate          datastore.CustomTemplateService
	edgeGroup               datastore.EdgeGroupService
	edgeJob                 datastore.EdgeJobService
	edgeStack               datastore.EdgeStackService
	endpoint                datastore.EndpointService
	endpointGroup           datastore.EndpointGroupService
	endpointRelation        datastore.EndpointRelationService
	helmUserRepository      datastore.HelmUserRepositoryService
	registry                datastore.RegistryService
	resourceControl         datastore.ResourceControlService
	apiKeyRepositoryService datastore.APIKeyRepository
	role                    datastore.RoleService
	sslSettings             datastore.SSLSettingsService
	settings                datastore.SettingsService
	stack                   datastore.StackService
	tag                     datastore.TagService
	teamMembership          datastore.TeamMembershipService
	team                    datastore.TeamService
	tunnelServer            datastore.TunnelServerService
	user                    datastore.UserService
	version                 datastore.VersionService
	webhook                 datastore.WebhookService
}

func (d *testDatastore) BackupTo(io.Writer) error                        { return nil }
func (d *testDatastore) Open() error                                     { return nil }
func (d *testDatastore) Init() error                                     { return nil }
func (d *testDatastore) Close() error                                    { return nil }
func (d *testDatastore) CheckCurrentEdition() error                      { return nil }
func (d *testDatastore) IsNew() bool                                     { return false }
func (d *testDatastore) MigrateData(force bool) error                    { return nil }
func (d *testDatastore) Rollback(force bool) error                       { return nil }
func (d *testDatastore) CustomTemplate() datastore.CustomTemplateService { return d.customTemplate }
func (d *testDatastore) EdgeGroup() datastore.EdgeGroupService           { return d.edgeGroup }
func (d *testDatastore) EdgeJob() datastore.EdgeJobService               { return d.edgeJob }
func (d *testDatastore) EdgeStack() datastore.EdgeStackService           { return d.edgeStack }
func (d *testDatastore) Endpoint() datastore.EndpointService             { return d.endpoint }
func (d *testDatastore) EndpointGroup() datastore.EndpointGroupService   { return d.endpointGroup }
func (d *testDatastore) EndpointRelation() datastore.EndpointRelationService {
	return d.endpointRelation
}
func (d *testDatastore) HelmUserRepository() datastore.HelmUserRepositoryService {
	return d.helmUserRepository
}
func (d *testDatastore) Registry() datastore.RegistryService               { return d.registry }
func (d *testDatastore) ResourceControl() datastore.ResourceControlService { return d.resourceControl }
func (d *testDatastore) Role() datastore.RoleService                       { return d.role }
func (d *testDatastore) APIKeyRepository() datastore.APIKeyRepository {
	return d.apiKeyRepositoryService
}
func (d *testDatastore) Settings() datastore.SettingsService             { return d.settings }
func (d *testDatastore) SSLSettings() datastore.SSLSettingsService       { return d.sslSettings }
func (d *testDatastore) Stack() datastore.StackService                   { return d.stack }
func (d *testDatastore) Tag() datastore.TagService                       { return d.tag }
func (d *testDatastore) TeamMembership() datastore.TeamMembershipService { return d.teamMembership }
func (d *testDatastore) Team() datastore.TeamService                     { return d.team }
func (d *testDatastore) TunnelServer() datastore.TunnelServerService     { return d.tunnelServer }
func (d *testDatastore) User() datastore.UserService                     { return d.user }
func (d *testDatastore) Version() datastore.VersionService               { return d.version }
func (d *testDatastore) Webhook() datastore.WebhookService               { return d.webhook }

func (d *testDatastore) IsErrObjectNotFound(e error) bool {
	return false
}

type datastoreOption = func(d *testDatastore)

// NewDatastore creates new instance of testDatastore.
// Will apply options before returning, opts will be applied from left to right.
func NewDatastore(options ...datastoreOption) *testDatastore {
	d := testDatastore{}
	for _, o := range options {
		o(&d)
	}
	return &d
}

type stubSettingsService struct {
	settings *portainer.Settings
}

func (s *stubSettingsService) Settings() (*portainer.Settings, error) {
	return s.settings, nil
}
func (s *stubSettingsService) UpdateSettings(settings *portainer.Settings) error {
	s.settings = settings
	return nil
}
func (s *stubSettingsService) IsFeatureFlagEnabled(feature portainer.Feature) bool {
	return false
}
func WithSettingsService(settings *portainer.Settings) datastoreOption {
	return func(d *testDatastore) {
		d.settings = &stubSettingsService{
			settings: settings,
		}
	}
}

type stubUserService struct {
	users []portainer.User
}

func (s *stubUserService) User(ID portainer.UserID) (*portainer.User, error)       { return nil, nil }
func (s *stubUserService) UserByUsername(username string) (*portainer.User, error) { return nil, nil }
func (s *stubUserService) Users() ([]portainer.User, error)                        { return s.users, nil }
func (s *stubUserService) UsersByRole(role portainer.UserRole) ([]portainer.User, error) {
	return s.users, nil
}
func (s *stubUserService) Create(user *portainer.User) error                          { return nil }
func (s *stubUserService) UpdateUser(ID portainer.UserID, user *portainer.User) error { return nil }
func (s *stubUserService) DeleteUser(ID portainer.UserID) error                       { return nil }

// WithUsers testDatastore option that will instruct testDatastore to return provided users
func WithUsers(us []portainer.User) datastoreOption {
	return func(d *testDatastore) {
		d.user = &stubUserService{users: us}
	}
}

type stubEdgeJobService struct {
	jobs []portainer.EdgeJob
}

func (s *stubEdgeJobService) EdgeJobs() ([]portainer.EdgeJob, error) { return s.jobs, nil }
func (s *stubEdgeJobService) EdgeJob(ID portainer.EdgeJobID) (*portainer.EdgeJob, error) {
	return nil, nil
}
func (s *stubEdgeJobService) Create(edgeJob *portainer.EdgeJob) error { return nil }
func (s *stubEdgeJobService) UpdateEdgeJob(ID portainer.EdgeJobID, edgeJob *portainer.EdgeJob) error {
	return nil
}
func (s *stubEdgeJobService) DeleteEdgeJob(ID portainer.EdgeJobID) error { return nil }
func (s *stubEdgeJobService) GetNextIdentifier() int                     { return 0 }

// WithEdgeJobs option will instruct testDatastore to return provided jobs
func WithEdgeJobs(js []portainer.EdgeJob) datastoreOption {
	return func(d *testDatastore) {
		d.edgeJob = &stubEdgeJobService{jobs: js}
	}
}

type stubEndpointRelationService struct {
	relations []portainer.EndpointRelation
}

func (s *stubEndpointRelationService) EndpointRelations() ([]portainer.EndpointRelation, error) {
	return s.relations, nil
}
func (s *stubEndpointRelationService) EndpointRelation(ID portainer.EndpointID) (*portainer.EndpointRelation, error) {
	for _, relation := range s.relations {
		if relation.EndpointID == ID {
			return &relation, nil
		}
	}

	return nil, errors.ErrObjectNotFound
}
func (s *stubEndpointRelationService) Create(EndpointRelation *portainer.EndpointRelation) error {
	return nil
}
func (s *stubEndpointRelationService) UpdateEndpointRelation(ID portainer.EndpointID, relation *portainer.EndpointRelation) error {
	for i, r := range s.relations {
		if r.EndpointID == ID {
			s.relations[i] = *relation
		}
	}

	return nil
}
func (s *stubEndpointRelationService) DeleteEndpointRelation(ID portainer.EndpointID) error {
	return nil
}
func (s *stubEndpointRelationService) GetNextIdentifier() int { return 0 }

// WithEndpointRelations option will instruct testDatastore to return provided jobs
func WithEndpointRelations(relations []portainer.EndpointRelation) datastoreOption {
	return func(d *testDatastore) {
		d.endpointRelation = &stubEndpointRelationService{relations: relations}
	}
}

type stubEndpointService struct {
	endpoints []portainer.Endpoint
}

func (s *stubEndpointService) Endpoint(ID portainer.EndpointID) (*portainer.Endpoint, error) {
	for _, endpoint := range s.endpoints {
		if endpoint.ID == ID {
			return &endpoint, nil
		}
	}

	return nil, errors.ErrObjectNotFound
}

func (s *stubEndpointService) Endpoints() ([]portainer.Endpoint, error) {
	return s.endpoints, nil
}

func (s *stubEndpointService) Create(endpoint *portainer.Endpoint) error {
	s.endpoints = append(s.endpoints, *endpoint)

	return nil
}

func (s *stubEndpointService) UpdateEndpoint(ID portainer.EndpointID, endpoint *portainer.Endpoint) error {
	for i, e := range s.endpoints {
		if e.ID == ID {
			s.endpoints[i] = *endpoint
		}
	}

	return nil
}

func (s *stubEndpointService) DeleteEndpoint(ID portainer.EndpointID) error {
	endpoints := []portainer.Endpoint{}

	for _, endpoint := range s.endpoints {
		if endpoint.ID != ID {
			endpoints = append(endpoints, endpoint)
		}
	}

	s.endpoints = endpoints

	return nil
}

func (s *stubEndpointService) GetNextIdentifier() int {
	return len(s.endpoints)
}

// WithEndpoints option will instruct testDatastore to return provided environments(endpoints)
func WithEndpoints(endpoints []portainer.Endpoint) datastoreOption {
	return func(d *testDatastore) {
		d.endpoint = &stubEndpointService{endpoints: endpoints}
	}
}
