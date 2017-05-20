package portainer

import "io"

type (
	// Pair defines a key/value string pair
	Pair struct {
		Name  string `json:"name"`
		Value string `json:"value"`
	}

	// CLIFlags represents the available flags on the CLI.
	CLIFlags struct {
		Addr              *string
		Assets            *string
		Data              *string
		ExternalEndpoints *string
		SyncInterval      *string
		Endpoint          *string
		Labels            *[]Pair
		Logo              *string
		Templates         *string
		NoAuth            *bool
		NoAnalytics       *bool
		TLSVerify         *bool
		TLSCacert         *string
		TLSCert           *string
		TLSKey            *string
		SSL               *bool
		SSLCert           *string
		SSLKey            *string
		AdminPassword     *string
	}

	// Settings represents Portainer settings.
	Settings struct {
		HiddenLabels       []Pair `json:"hiddenLabels"`
		Logo               string `json:"logo"`
		Authentication     bool   `json:"authentication"`
		Analytics          bool   `json:"analytics"`
		EndpointManagement bool   `json:"endpointManagement"`
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

	// EndpointID represents an endpoint identifier.
	EndpointID int

	// Endpoint represents a Docker endpoint with all the info required
	// to connect to it.
	Endpoint struct {
		ID              EndpointID `json:"Id"`
		Name            string     `json:"Name"`
		URL             string     `json:"URL"`
		PublicURL       string     `json:"PublicURL"`
		TLS             bool       `json:"TLS"`
		TLSCACertPath   string     `json:"TLSCACert,omitempty"`
		TLSCertPath     string     `json:"TLSCert,omitempty"`
		TLSKeyPath      string     `json:"TLSKey,omitempty"`
		AuthorizedUsers []UserID   `json:"AuthorizedUsers"`
		AuthorizedTeams []TeamID   `json:"AuthorizedTeams"`
	}

	// ResourceControlID represents a resource control identifier.
	ResourceControlID int

	// ResourceControl represent a reference to a Docker resource with specific access controls
	ResourceControl struct {
		ID                 ResourceControlID   `json:"Id"`
		ResourceID         string              `json:"ResourceId"`
		SubResourceIDs     []string            `json:"SubResourceIds"`
		Type               ResourceControlType `json:"Type"`
		AdministratorsOnly bool                `json:"AdministratorsOnly"`

		UserAccesses []UserResourceAccess `json:"UserAccesses"`
		TeamAccesses []TeamResourceAccess `json:"TeamAccesses"`

		// Deprecated fields
		// Deprecated: OwnerID field is deprecated in DBVersion == 2
		OwnerID UserID `json:"OwnerId"`
		// Deprecated: AccessLevel field is deprecated in DBVersion == 2
		AccessLevel ResourceAccessLevel `json:"AccessLevel"`
	}

	// ResourceControlType represents the type of resource associated to the resource control (volume, container, service).
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
		// TeamsByUserID(ID UserID) ([]Team, error)
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

	// VersionService represents a service for managing version data.
	VersionService interface {
		DBVersion() (int, error)
		StoreDBVersion(version int) error
	}

	// ResourceControlService represents a service for managing resource control data.
	ResourceControlService interface {
		ResourceControl(ID ResourceControlID) (*ResourceControl, error)
		ResourceControls() ([]ResourceControl, error)
		CreateResourceControl(rc *ResourceControl) error
		UpdateResourceControl(ID ResourceControlID, resourceControl *ResourceControl) error
		DeleteResourceControl(ID ResourceControlID) error
	}

	// CryptoService represents a service for encrypting/hashing data.
	CryptoService interface {
		Hash(data string) (string, error)
		CompareHashAndData(hash string, data string) error
	}

	// JWTService represents a service for managing JWT tokens.
	JWTService interface {
		GenerateToken(data *TokenData) (string, error)
		ParseAndVerifyToken(token string) (*TokenData, error)
	}

	// FileService represents a service for managing files.
	FileService interface {
		StoreTLSFile(endpointID EndpointID, fileType TLSFileType, r io.Reader) error
		GetPathForTLSFile(endpointID EndpointID, fileType TLSFileType) (string, error)
		DeleteTLSFiles(endpointID EndpointID) error
	}

	// EndpointWatcher represents a service to synchronize the endpoints via an external source.
	EndpointWatcher interface {
		WatchEndpointFile(endpointFilePath string) error
	}
)

const (
	// APIVersion is the version number of the Portainer API.
	APIVersion = "1.12.4"
	// DBVersion is the version number of the Portainer database.
	DBVersion = 2
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
)
