package portainer

import (
	"io"
)

type (
	// Pair defines a key/value string pair
	Pair struct {
		Name  string `json:"name"`
		Value string `json:"value"`
	}

	// CLIFlags represents the available flags on the CLI.
	CLIFlags struct {
		Addr      *string
		Assets    *string
		Data      *string
		Endpoint  *string
		Labels    *[]Pair
		Logo      *string
		Swarm     *bool
		Templates *string
		TLSVerify *bool
		TLSCacert *string
		TLSCert   *string
		TLSKey    *string
	}

	// Settings represents Portainer settings.
	Settings struct {
		Swarm        bool   `json:"swarm"`
		HiddenLabels []Pair `json:"hiddenLabels"`
		Logo         string `json:"logo"`
	}

	// User represent a user account.
	User struct {
		Username string `json:"Username"`
		Password string `json:"Password,omitempty"`
	}

	// TokenData represents the data embedded in a JWT token.
	TokenData struct {
		Username string
	}

	// EndpointID represents an endpoint identifier.
	EndpointID int

	// Endpoint represents a Docker endpoint with all the info required
	// to connect to it.
	Endpoint struct {
		ID            EndpointID `json:"Id"`
		Name          string     `json:"Name"`
		URL           string     `json:"URL"`
		Swarm         bool       `json:"Swarm"`
		TLS           bool       `json:"TLS"`
		TLSCACertPath string     `json:"TLSCACert,omitempty"`
		TLSCertPath   string     `json:"TLSCert,omitempty"`
		TLSKeyPath    string     `json:"TLSKey,omitempty"`
	}

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
	}

	// Server defines the interface to serve the data.
	Server interface {
		Start() error
	}

	// UserService represents a service for managing users.
	UserService interface {
		User(username string) (*User, error)
		UpdateUser(user *User) error
	}

	// EndpointService represents a service for managing endpoints.
	EndpointService interface {
		Endpoint(ID EndpointID) (*Endpoint, error)
		Endpoints() ([]Endpoint, error)
		CreateEndpoint(endpoint *Endpoint) error
		UpdateEndpoint(ID EndpointID, endpoint *Endpoint) error
		DeleteEndpoint(ID EndpointID) error
		GetActive() (*Endpoint, error)
		SetActive(endpoint *Endpoint) error
	}

	// CryptoService represents a service for encrypting/hashing data.
	CryptoService interface {
		Hash(data string) (string, error)
		CompareHashAndData(hash string, data string) error
	}

	// JWTService represents a service for managing JWT tokens.
	JWTService interface {
		GenerateToken(data *TokenData) (string, error)
		VerifyToken(token string) error
	}

	// FileService represents a service for managing files.
	FileService interface {
		StoreTLSFile(endpointID EndpointID, fileType TLSFileType, r io.Reader) error
		GetPathForTLSFile(endpointID EndpointID, fileType TLSFileType) (string, error)
		DeleteTLSFiles(endpointID EndpointID) error
	}
)

const (
	// APIVersion is the version number of portainer API.
	APIVersion = "1.10.2"
)

const (
	// TLSFileCA represents a TLS CA certificate file.
	TLSFileCA TLSFileType = iota
	// TLSFileCert represents a TLS certificate file.
	TLSFileCert
	// TLSFileKey represents a TLS key file.
	TLSFileKey
)
