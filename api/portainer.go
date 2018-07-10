package portainer

type (
	// Pair defines a key/value string pair
	Pair struct {
		Name  string `json:"name"`
		Value string `json:"value"`
	}

	// CLIFlags represents the available flags on the CLI.
	CLIFlags struct {
		Addr              *string
		AdminPassword     *string
		AdminPasswordFile *string
		Assets            *string
		Data              *string
		EndpointURL       *string
		ExternalEndpoints *string
		Labels            *[]Pair
		Logo              *string
		NoAuth            *bool
		NoAnalytics       *bool
		Templates         *string
		TemplateFile      *string
		TLS               *bool
		TLSSkipVerify     *bool
		TLSCacert         *string
		TLSCert           *string
		TLSKey            *string
		SSL               *bool
		SSLCert           *string
		SSLKey            *string
		SyncInterval      *string
		Snapshot          *bool
		SnapshotInterval  *string
	}

	// Status represents the application status.
	Status struct {
		Authentication     bool   `json:"Authentication"`
		EndpointManagement bool   `json:"EndpointManagement"`
		Snapshot           bool   `json:"Snapshot"`
		Analytics          bool   `json:"Analytics"`
		Version            string `json:"Version"`
	}

	// LDAPSettings represents the settings used to connect to a LDAP server.
	LDAPSettings struct {
		ReaderDN       string               `json:"ReaderDN"`
		Password       string               `json:"Password"`
		URL            string               `json:"URL"`
		TLSConfig      TLSConfiguration     `json:"TLSConfig"`
		StartTLS       bool                 `json:"StartTLS"`
		SearchSettings []LDAPSearchSettings `json:"SearchSettings"`
	}

	// TLSConfiguration represents a TLS configuration.
	TLSConfiguration struct {
		TLS           bool   `json:"TLS"`
		TLSSkipVerify bool   `json:"TLSSkipVerify"`
		TLSCACertPath string `json:"TLSCACert,omitempty"`
		TLSCertPath   string `json:"TLSCert,omitempty"`
		TLSKeyPath    string `json:"TLSKey,omitempty"`
	}

	// LDAPSearchSettings represents settings used to search for users in a LDAP server.
	LDAPSearchSettings struct {
		BaseDN            string `json:"BaseDN"`
		Filter            string `json:"Filter"`
		UserNameAttribute string `json:"UserNameAttribute"`
	}

	// Settings represents the application settings.
	Settings struct {
		LogoURL                            string               `json:"LogoURL"`
		BlackListedLabels                  []Pair               `json:"BlackListedLabels"`
		AuthenticationMethod               AuthenticationMethod `json:"AuthenticationMethod"`
		LDAPSettings                       LDAPSettings         `json:"LDAPSettings"`
		AllowBindMountsForRegularUsers     bool                 `json:"AllowBindMountsForRegularUsers"`
		AllowPrivilegedModeForRegularUsers bool                 `json:"AllowPrivilegedModeForRegularUsers"`
		SnapshotInterval                   string               `json:"SnapshotInterval"`

		// Deprecated fields
		DisplayDonationHeader       bool
		DisplayExternalContributors bool
		TemplatesURL                string
	}

	// User represents a user account.
	User struct {
		ID       UserID   `json:"Id"`
		Username string   `json:"Username"`
		Password string   `json:"Password,omitempty"`
		Role     UserRole `json:"Role"`
	}

	// UserID represents a user identifier
	UserID int

	// UserRole represents the role of a user. It can be either an administrator
	// or a regular user
	UserRole int

	// AuthenticationMethod represents the authentication method used to authenticate a user.
	AuthenticationMethod int

	// Team represents a list of user accounts.
	Team struct {
		ID   TeamID `json:"Id"`
		Name string `json:"Name"`
	}

	// TeamID represents a team identifier
	TeamID int

	// TeamMembership represents a membership association between a user and a team
	TeamMembership struct {
		ID     TeamMembershipID `json:"Id"`
		UserID UserID           `json:"UserID"`
		TeamID TeamID           `json:"TeamID"`
		Role   MembershipRole   `json:"Role"`
	}

	// TeamMembershipID represents a team membership identifier
	TeamMembershipID int

	// MembershipRole represents the role of a user within a team
	MembershipRole int

	// TokenData represents the data embedded in a JWT token.
	TokenData struct {
		ID       UserID
		Username string
		Role     UserRole
	}

	// StackID represents a stack identifier (it must be composed of Name + "_" + SwarmID to create a unique identifier).
	StackID int

	// StackType represents the type of the stack (compose v2, stack deploy v3).
	StackType int

	// Stack represents a Docker stack created via docker stack deploy.
	Stack struct {
		ID          StackID    `json:"Id"`
		Name        string     `json:"Name"`
		Type        StackType  `json:"Type"`
		EndpointID  EndpointID `json:"EndpointId"`
		SwarmID     string     `json:"SwarmId"`
		EntryPoint  string     `json:"EntryPoint"`
		Env         []Pair     `json:"Env"`
		ProjectPath string
	}

	// RegistryID represents a registry identifier.
	RegistryID int

	// Registry represents a Docker registry with all the info required
	// to connect to it.
	Registry struct {
		ID              RegistryID `json:"Id"`
		Name            string     `json:"Name"`
		URL             string     `json:"URL"`
		Authentication  bool       `json:"Authentication"`
		Username        string     `json:"Username"`
		Password        string     `json:"Password,omitempty"`
		AuthorizedUsers []UserID   `json:"AuthorizedUsers"`
		AuthorizedTeams []TeamID   `json:"AuthorizedTeams"`
	}

	// DockerHub represents all the required information to connect and use the
	// Docker Hub.
	DockerHub struct {
		Authentication bool   `json:"Authentication"`
		Username       string `json:"Username"`
		Password       string `json:"Password,omitempty"`
	}

	// EndpointID represents an endpoint identifier.
	EndpointID int

	// EndpointType represents the type of an endpoint.
	EndpointType int

	// EndpointStatus represents the status of an endpoint
	EndpointStatus int

	// Endpoint represents a Docker endpoint with all the info required
	// to connect to it.
	Endpoint struct {
		ID               EndpointID          `json:"Id"`
		Name             string              `json:"Name"`
		Type             EndpointType        `json:"Type"`
		URL              string              `json:"URL"`
		GroupID          EndpointGroupID     `json:"GroupId"`
		PublicURL        string              `json:"PublicURL"`
		TLSConfig        TLSConfiguration    `json:"TLSConfig"`
		AuthorizedUsers  []UserID            `json:"AuthorizedUsers"`
		AuthorizedTeams  []TeamID            `json:"AuthorizedTeams"`
		Extensions       []EndpointExtension `json:"Extensions"`
		AzureCredentials AzureCredentials    `json:"AzureCredentials,omitempty"`
		Tags             []string            `json:"Tags"`
		Status           EndpointStatus      `json:"Status"`
		Snapshots        []Snapshot          `json:"Snapshots"`

		// Deprecated fields
		// Deprecated in DBVersion == 4
		TLS           bool   `json:"TLS,omitempty"`
		TLSCACertPath string `json:"TLSCACert,omitempty"`
		TLSCertPath   string `json:"TLSCert,omitempty"`
		TLSKeyPath    string `json:"TLSKey,omitempty"`
	}

	// AzureCredentials represents the credentials used to connect to an Azure
	// environment.
	AzureCredentials struct {
		ApplicationID     string `json:"ApplicationID"`
		TenantID          string `json:"TenantID"`
		AuthenticationKey string `json:"AuthenticationKey"`
	}

	// Snapshot represents a snapshot of a specific endpoint at a specific time
	Snapshot struct {
		Time                  int64  `json:"Time"`
		DockerVersion         string `json:"DockerVersion"`
		Swarm                 bool   `json:"Swarm"`
		TotalCPU              int    `json:"TotalCPU"`
		TotalMemory           int64  `json:"TotalMemory"`
		RunningContainerCount int    `json:"RunningContainerCount"`
		StoppedContainerCount int    `json:"StoppedContainerCount"`
		VolumeCount           int    `json:"VolumeCount"`
		ImageCount            int    `json:"ImageCount"`
		ServiceCount          int    `json:"ServiceCount"`
		StackCount            int    `json:"StackCount"`
	}

	// EndpointGroupID represents an endpoint group identifier.
	EndpointGroupID int

	// EndpointGroup represents a group of endpoints.
	EndpointGroup struct {
		ID              EndpointGroupID `json:"Id"`
		Name            string          `json:"Name"`
		Description     string          `json:"Description"`
		AuthorizedUsers []UserID        `json:"AuthorizedUsers"`
		AuthorizedTeams []TeamID        `json:"AuthorizedTeams"`
		Tags            []string        `json:"Tags"`

		// Deprecated fields
		Labels []Pair `json:"Labels"`
	}

	// EndpointExtension represents a extension associated to an endpoint.
	EndpointExtension struct {
		Type EndpointExtensionType `json:"Type"`
		URL  string                `json:"URL"`
	}

	// EndpointExtensionType represents the type of an endpoint extension. Only
	// one extension of each type can be associated to an endpoint.
	EndpointExtensionType int

	// ResourceControlID represents a resource control identifier.
	ResourceControlID int

	// ResourceControl represent a reference to a Docker resource with specific access controls
	ResourceControl struct {
		ID                 ResourceControlID    `json:"Id"`
		ResourceID         string               `json:"ResourceId"`
		SubResourceIDs     []string             `json:"SubResourceIds"`
		Type               ResourceControlType  `json:"Type"`
		AdministratorsOnly bool                 `json:"AdministratorsOnly"`
		UserAccesses       []UserResourceAccess `json:"UserAccesses"`
		TeamAccesses       []TeamResourceAccess `json:"TeamAccesses"`

		// Deprecated fields
		// Deprecated in DBVersion == 2
		OwnerID     UserID              `json:"OwnerId,omitempty"`
		AccessLevel ResourceAccessLevel `json:"AccessLevel,omitempty"`
	}

	// ResourceControlType represents the type of resource associated to the resource control (volume, container, service...).
	ResourceControlType int

	// UserResourceAccess represents the level of control on a resource for a specific user.
	UserResourceAccess struct {
		UserID      UserID              `json:"UserId"`
		AccessLevel ResourceAccessLevel `json:"AccessLevel"`
	}

	// TeamResourceAccess represents the level of control on a resource for a specific team.
	TeamResourceAccess struct {
		TeamID      TeamID              `json:"TeamId"`
		AccessLevel ResourceAccessLevel `json:"AccessLevel"`
	}

	// TagID represents a tag identifier.
	TagID int

	// Tag represents a tag that can be associated to a resource.
	Tag struct {
		ID   TagID
		Name string `json:"Name"`
	}

	// TemplateID represents a template identifier.
	TemplateID int

	// TemplateType represents the type of a template.
	TemplateType int

	// Template represents an application template.
	Template struct {
		// Mandatory container/stack fields
		ID                TemplateID   `json:"Id"`
		Type              TemplateType `json:"type"`
		Title             string       `json:"title"`
		Description       string       `json:"description"`
		AdministratorOnly bool         `json:"administrator_only"`

		// Mandatory container fields
		Image string `json:"image"`

		// Mandatory stack fields
		Repository TemplateRepository `json:"repository"`

		// Optional stack/container fields
		Name       string        `json:"name,omitempty"`
		Logo       string        `json:"logo,omitempty"`
		Env        []TemplateEnv `json:"env,omitempty"`
		Note       string        `json:"note,omitempty"`
		Platform   string        `json:"platform,omitempty"`
		Categories []string      `json:"categories,omitempty"`

		// Optional container fields
		Registry      string           `json:"registry,omitempty"`
		Command       string           `json:"command,omitempty"`
		Network       string           `json:"network,omitempty"`
		Volumes       []TemplateVolume `json:"volumes,omitempty"`
		Ports         []string         `json:"ports,omitempty"`
		Labels        []Pair           `json:"labels,omitempty"`
		Privileged    bool             `json:"privileged,omitempty"`
		Interactive   bool             `json:"interactive,omitempty"`
		RestartPolicy string           `json:"restart_policy,omitempty"`
		Hostname      string           `json:"hostname,omitempty"`
	}

	// TemplateEnv represents a template environment variable configuration.
	TemplateEnv struct {
		Name        string              `json:"name"`
		Label       string              `json:"label,omitempty"`
		Description string              `json:"description,omitempty"`
		Default     string              `json:"default,omitempty"`
		Preset      bool                `json:"preset,omitempty"`
		Select      []TemplateEnvSelect `json:"select,omitempty"`
	}

	// TemplateVolume represents a template volume configuration.
	TemplateVolume struct {
		Container string `json:"container"`
		Bind      string `json:"bind,omitempty"`
		ReadOnly  bool   `json:"readonly,omitempty"`
	}

	// TemplateRepository represents the git repository configuration for a template.
	TemplateRepository struct {
		URL       string `json:"url"`
		StackFile string `json:"stackfile"`
	}

	// TemplateEnvSelect represents text/value pair that will be displayed as a choice for the
	// template user.
	TemplateEnvSelect struct {
		Text    string `json:"text"`
		Value   string `json:"value"`
		Default bool   `json:"default"`
	}

	// ResourceAccessLevel represents the level of control associated to a resource.
	ResourceAccessLevel int

	// TLSFileType represents a type of TLS file required to connect to a Docker endpoint.
	// It can be either a TLS CA file, a TLS certificate file or a TLS key file.
	TLSFileType int

	// CLIService represents a service for managing CLI.
	CLIService interface {
		ParseFlags(version string) (*CLIFlags, error)
		ValidateFlags(flags *CLIFlags) error
	}

	// DataStore defines the interface to manage the data.
	DataStore interface {
		Open() error
		Init() error
		Close() error
		MigrateData() error
	}

	// Server defines the interface to serve the API.
	Server interface {
		Start() error
	}

	// UserService represents a service for managing user data.
	UserService interface {
		User(ID UserID) (*User, error)
		UserByUsername(username string) (*User, error)
		Users() ([]User, error)
		UsersByRole(role UserRole) ([]User, error)
		CreateUser(user *User) error
		UpdateUser(ID UserID, user *User) error
		DeleteUser(ID UserID) error
	}

	// TeamService represents a service for managing user data.
	TeamService interface {
		Team(ID TeamID) (*Team, error)
		TeamByName(name string) (*Team, error)
		Teams() ([]Team, error)
		CreateTeam(team *Team) error
		UpdateTeam(ID TeamID, team *Team) error
		DeleteTeam(ID TeamID) error
	}

	// TeamMembershipService represents a service for managing team membership data.
	TeamMembershipService interface {
		TeamMembership(ID TeamMembershipID) (*TeamMembership, error)
		TeamMemberships() ([]TeamMembership, error)
		TeamMembershipsByUserID(userID UserID) ([]TeamMembership, error)
		TeamMembershipsByTeamID(teamID TeamID) ([]TeamMembership, error)
		CreateTeamMembership(membership *TeamMembership) error
		UpdateTeamMembership(ID TeamMembershipID, membership *TeamMembership) error
		DeleteTeamMembership(ID TeamMembershipID) error
		DeleteTeamMembershipByUserID(userID UserID) error
		DeleteTeamMembershipByTeamID(teamID TeamID) error
	}

	// EndpointService represents a service for managing endpoint data.
	EndpointService interface {
		Endpoint(ID EndpointID) (*Endpoint, error)
		Endpoints() ([]Endpoint, error)
		CreateEndpoint(endpoint *Endpoint) error
		UpdateEndpoint(ID EndpointID, endpoint *Endpoint) error
		DeleteEndpoint(ID EndpointID) error
		Synchronize(toCreate, toUpdate, toDelete []*Endpoint) error
	}

	// EndpointGroupService represents a service for managing endpoint group data.
	EndpointGroupService interface {
		EndpointGroup(ID EndpointGroupID) (*EndpointGroup, error)
		EndpointGroups() ([]EndpointGroup, error)
		CreateEndpointGroup(group *EndpointGroup) error
		UpdateEndpointGroup(ID EndpointGroupID, group *EndpointGroup) error
		DeleteEndpointGroup(ID EndpointGroupID) error
	}

	// RegistryService represents a service for managing registry data.
	RegistryService interface {
		Registry(ID RegistryID) (*Registry, error)
		Registries() ([]Registry, error)
		CreateRegistry(registry *Registry) error
		UpdateRegistry(ID RegistryID, registry *Registry) error
		DeleteRegistry(ID RegistryID) error
	}

	// StackService represents a service for managing stack data.
	StackService interface {
		Stack(ID StackID) (*Stack, error)
		StackByName(name string) (*Stack, error)
		Stacks() ([]Stack, error)
		CreateStack(stack *Stack) error
		UpdateStack(ID StackID, stack *Stack) error
		DeleteStack(ID StackID) error
		GetNextIdentifier() int
	}

	// DockerHubService represents a service for managing the DockerHub object.
	DockerHubService interface {
		DockerHub() (*DockerHub, error)
		UpdateDockerHub(registry *DockerHub) error
	}

	// SettingsService represents a service for managing application settings.
	SettingsService interface {
		Settings() (*Settings, error)
		UpdateSettings(settings *Settings) error
	}

	// VersionService represents a service for managing version data.
	VersionService interface {
		DBVersion() (int, error)
		StoreDBVersion(version int) error
	}

	// ResourceControlService represents a service for managing resource control data.
	ResourceControlService interface {
		ResourceControl(ID ResourceControlID) (*ResourceControl, error)
		ResourceControlByResourceID(resourceID string) (*ResourceControl, error)
		ResourceControls() ([]ResourceControl, error)
		CreateResourceControl(rc *ResourceControl) error
		UpdateResourceControl(ID ResourceControlID, resourceControl *ResourceControl) error
		DeleteResourceControl(ID ResourceControlID) error
	}

	// TagService represents a service for managing tag data.
	TagService interface {
		Tags() ([]Tag, error)
		CreateTag(tag *Tag) error
		DeleteTag(ID TagID) error
	}

	// TemplateService represents a service for managing template data.
	TemplateService interface {
		Templates() ([]Template, error)
		Template(ID TemplateID) (*Template, error)
		CreateTemplate(template *Template) error
		UpdateTemplate(ID TemplateID, template *Template) error
		DeleteTemplate(ID TemplateID) error
	}

	// CryptoService represents a service for encrypting/hashing data.
	CryptoService interface {
		Hash(data string) (string, error)
		CompareHashAndData(hash string, data string) error
	}

	// DigitalSignatureService represents a service to manage digital signatures.
	DigitalSignatureService interface {
		ParseKeyPair(private, public []byte) error
		GenerateKeyPair() ([]byte, []byte, error)
		EncodedPublicKey() string
		PEMHeaders() (string, string)
		Sign(message string) (string, error)
	}

	// JWTService represents a service for managing JWT tokens.
	JWTService interface {
		GenerateToken(data *TokenData) (string, error)
		ParseAndVerifyToken(token string) (*TokenData, error)
	}

	// FileService represents a service for managing files.
	FileService interface {
		GetFileContent(filePath string) ([]byte, error)
		Rename(oldPath, newPath string) error
		RemoveDirectory(directoryPath string) error
		StoreTLSFileFromBytes(folder string, fileType TLSFileType, data []byte) (string, error)
		GetPathForTLSFile(folder string, fileType TLSFileType) (string, error)
		DeleteTLSFile(folder string, fileType TLSFileType) error
		DeleteTLSFiles(folder string) error
		GetStackProjectPath(stackIdentifier string) string
		StoreStackFileFromBytes(stackIdentifier, fileName string, data []byte) (string, error)
		KeyPairFilesExist() (bool, error)
		StoreKeyPair(private, public []byte, privatePEMHeader, publicPEMHeader string) error
		LoadKeyPair() ([]byte, []byte, error)
		WriteJSONToFile(path string, content interface{}) error
		FileExists(path string) (bool, error)
	}

	// GitService represents a service for managing Git.
	GitService interface {
		ClonePublicRepository(repositoryURL, destination string) error
		ClonePrivateRepositoryWithBasicAuth(repositoryURL, destination, username, password string) error
	}

	// JobScheduler represents a service to run jobs on a periodic basis.
	JobScheduler interface {
		ScheduleEndpointSyncJob(endpointFilePath, interval string) error
		ScheduleSnapshotJob(interval string) error
		UpdateSnapshotJob(interval string)
		Start()
	}

	// Snapshotter represents a service used to create endpoint snapshots.
	Snapshotter interface {
		CreateSnapshot(endpoint *Endpoint) (*Snapshot, error)
	}

	// LDAPService represents a service used to authenticate users against a LDAP/AD.
	LDAPService interface {
		AuthenticateUser(username, password string, settings *LDAPSettings) error
		TestConnectivity(settings *LDAPSettings) error
	}

	// SwarmStackManager represents a service to manage Swarm stacks.
	SwarmStackManager interface {
		Login(dockerhub *DockerHub, registries []Registry, endpoint *Endpoint)
		Logout(endpoint *Endpoint) error
		Deploy(stack *Stack, prune bool, endpoint *Endpoint) error
		Remove(stack *Stack, endpoint *Endpoint) error
	}

	// ComposeStackManager represents a service to manage Compose stacks.
	ComposeStackManager interface {
		Up(stack *Stack, endpoint *Endpoint) error
		Down(stack *Stack, endpoint *Endpoint) error
	}
)

const (
	// APIVersion is the version number of the Portainer API.
	APIVersion = "1.18.2-dev"
	// DBVersion is the version number of the Portainer database.
	DBVersion = 12
	// PortainerAgentHeader represents the name of the header available in any agent response
	PortainerAgentHeader = "Portainer-Agent"
	// PortainerAgentTargetHeader represent the name of the header containing the target node name.
	PortainerAgentTargetHeader = "X-PortainerAgent-Target"
	// PortainerAgentSignatureHeader represent the name of the header containing the digital signature
	PortainerAgentSignatureHeader = "X-PortainerAgent-Signature"
	// PortainerAgentPublicKeyHeader represent the name of the header containing the public key
	PortainerAgentPublicKeyHeader = "X-PortainerAgent-PublicKey"
	// PortainerAgentSignatureMessage represents the message used to create a digital signature
	// to be used when communicating with an agent
	PortainerAgentSignatureMessage = "Portainer-App"
	// SupportedDockerAPIVersion is the minimum Docker API version supported by Portainer.
	SupportedDockerAPIVersion = "1.24"
)

const (
	// TLSFileCA represents a TLS CA certificate file.
	TLSFileCA TLSFileType = iota
	// TLSFileCert represents a TLS certificate file.
	TLSFileCert
	// TLSFileKey represents a TLS key file.
	TLSFileKey
)

const (
	_ MembershipRole = iota
	// TeamLeader represents a leader role inside a team
	TeamLeader
	// TeamMember represents a member role inside a team
	TeamMember
)

const (
	_ UserRole = iota
	// AdministratorRole represents an administrator user role
	AdministratorRole
	// StandardUserRole represents a regular user role
	StandardUserRole
)

const (
	_ AuthenticationMethod = iota
	// AuthenticationInternal represents the internal authentication method (authentication against Portainer API)
	AuthenticationInternal
	// AuthenticationLDAP represents the LDAP authentication method (authentication against a LDAP server)
	AuthenticationLDAP
)

const (
	_ ResourceAccessLevel = iota
	// ReadWriteAccessLevel represents an access level with read-write permissions on a resource
	ReadWriteAccessLevel
)

const (
	_ ResourceControlType = iota
	// ContainerResourceControl represents a resource control associated to a Docker container
	ContainerResourceControl
	// ServiceResourceControl represents a resource control associated to a Docker service
	ServiceResourceControl
	// VolumeResourceControl represents a resource control associated to a Docker volume
	VolumeResourceControl
	// NetworkResourceControl represents a resource control associated to a Docker network
	NetworkResourceControl
	// SecretResourceControl represents a resource control associated to a Docker secret
	SecretResourceControl
	// StackResourceControl represents a resource control associated to a stack composed of Docker services
	StackResourceControl
	// ConfigResourceControl represents a resource control associated to a Docker config
	ConfigResourceControl
)

const (
	_ EndpointExtensionType = iota
	// StoridgeEndpointExtension represents the Storidge extension
	StoridgeEndpointExtension
)

const (
	_ EndpointType = iota
	// DockerEnvironment represents an endpoint connected to a Docker environment
	DockerEnvironment
	// AgentOnDockerEnvironment represents an endpoint connected to a Portainer agent deployed on a Docker environment
	AgentOnDockerEnvironment
	// AzureEnvironment represents an endpoint connected to an Azure environment
	AzureEnvironment
)

const (
	_ StackType = iota
	// DockerSwarmStack represents a stack managed via docker stack
	DockerSwarmStack
	// DockerComposeStack represents a stack managed via docker-compose
	DockerComposeStack
)

const (
	_ TemplateType = iota
	// ContainerTemplate represents a container template
	ContainerTemplate
	// SwarmStackTemplate represents a template used to deploy a Swarm stack
	SwarmStackTemplate
	// ComposeStackTemplate represents a template used to deploy a Compose stack
	ComposeStackTemplate
)

const (
	_ EndpointStatus = iota
	// EndpointStatusUp is used to represent an available endpoint
	EndpointStatusUp
	// EndpointStatusDown is used to represent an unavailable endpoint
	EndpointStatusDown
)
