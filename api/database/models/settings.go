package models

const (
	_ AuthenticationMethod = iota
	// AuthenticationInternal represents the internal authentication method (authentication against Portainer API)
	AuthenticationInternal
	// AuthenticationLDAP represents the LDAP authentication method (authentication against a LDAP server)
	AuthenticationLDAP
	//AuthenticationOAuth represents the OAuth authentication method (authentication against a authorization server)
	AuthenticationOAuth
)

type (

	// AuthenticationMethod represents the authentication method used to authenticate a user
	AuthenticationMethod int

	// InternalAuthSettings represents settings used for the default 'internal' authentication
	InternalAuthSettings struct {
		RequiredPasswordLength int
	}

	// OAuthSettings represents the settings used to authorize with an authorization server
	OAuthSettings struct {
		ClientID             string `json:"ClientID"`
		ClientSecret         string `json:"ClientSecret,omitempty"`
		AccessTokenURI       string `json:"AccessTokenURI"`
		AuthorizationURI     string `json:"AuthorizationURI"`
		ResourceURI          string `json:"ResourceURI"`
		RedirectURI          string `json:"RedirectURI"`
		UserIdentifier       string `json:"UserIdentifier"`
		Scopes               string `json:"Scopes"`
		OAuthAutoCreateUsers bool   `json:"OAuthAutoCreateUsers"`
		DefaultTeamID        TeamID `json:"DefaultTeamID"`
		SSO                  bool   `json:"SSO"`
		LogoutURI            string `json:"LogoutURI"`
		KubeSecretKey        []byte `json:"KubeSecretKey"`
	}

	// Settings represents the application settings
	Settings struct {
		// URL to a logo that will be displayed on the login page as well as on top of the sidebar. Will use default Portainer logo when value is empty string
		LogoURL string `json:"LogoURL" example:"https://mycompany.mydomain.tld/logo.png"`
		// A list of label name & value that will be used to hide containers when querying containers
		BlackListedLabels []Pair `json:"BlackListedLabels"`
		// Active authentication method for the Portainer instance. Valid values are: 1 for internal, 2 for LDAP, or 3 for oauth
		AuthenticationMethod AuthenticationMethod `json:"AuthenticationMethod" example:"1"`
		InternalAuthSettings InternalAuthSettings `json:"InternalAuthSettings" example:""`
		LDAPSettings         LDAPSettings         `json:"LDAPSettings" example:""`
		OAuthSettings        OAuthSettings        `json:"OAuthSettings" example:""`
		OpenAMTConfiguration OpenAMTConfiguration `json:"openAMTConfiguration" example:""`
		FDOConfiguration     FDOConfiguration     `json:"fdoConfiguration" example:""`
		FeatureFlagSettings  map[Feature]bool     `json:"FeatureFlagSettings" example:""`
		// The interval in which environment(endpoint) snapshots are created
		SnapshotInterval string `json:"SnapshotInterval" example:"5m"`
		// URL to the templates that will be displayed in the UI when navigating to App Templates
		TemplatesURL string `json:"TemplatesURL" example:"https://raw.githubusercontent.com/portainer/templates/master/templates.json"`
		// The default check in interval for edge agent (in seconds)
		EdgeAgentCheckinInterval int `json:"EdgeAgentCheckinInterval" example:"5"`
		// Whether edge compute features are enabled
		EnableEdgeComputeFeatures bool `json:"EnableEdgeComputeFeatures" example:""`
		// The duration of a user session
		UserSessionTimeout string `json:"UserSessionTimeout" example:"5m"`
		// The expiry of a Kubeconfig
		KubeconfigExpiry string `json:"KubeconfigExpiry" example:"24h"`
		// Whether telemetry is enabled
		EnableTelemetry bool `json:"EnableTelemetry" example:"false"`
		// Helm repository URL, defaults to "https://charts.bitnami.com/bitnami"
		HelmRepositoryURL string `json:"HelmRepositoryURL" example:"https://charts.bitnami.com/bitnami"`
		// KubectlImage, defaults to portainer/kubectl-shell
		KubectlShellImage string `json:"KubectlShellImage" example:"portainer/kubectl-shell"`
		// TrustOnFirstConnect makes Portainer accepting edge agent connection by default
		TrustOnFirstConnect bool `json:"TrustOnFirstConnect" example:"false"`
		// EnforceEdgeID makes Portainer store the Edge ID instead of accepting anyone
		EnforceEdgeID bool `json:"EnforceEdgeID" example:"false"`
		// Container environment parameter AGENT_SECRET
		AgentSecret string `json:"AgentSecret"`
		// EdgePortainerURL is the URL that is exposed to edge agents
		EdgePortainerURL string `json:"EdgePortainerUrl"`

		Edge struct {
			// The command list interval for edge agent - used in edge async mode (in seconds)
			CommandInterval int `json:"CommandInterval" example:"5"`
			// The ping interval for edge agent - used in edge async mode (in seconds)
			PingInterval int `json:"PingInterval" example:"5"`
			// The snapshot interval for edge agent - used in edge async mode (in seconds)
			SnapshotInterval int `json:"SnapshotInterval" example:"5"`
			// EdgeAsyncMode enables edge async mode by default
			AsyncMode bool
		}

		// Deprecated fields
		DisplayDonationHeader       bool
		DisplayExternalContributors bool

		// Deprecated fields v26
		EnableHostManagementFeatures              bool `json:"EnableHostManagementFeatures"`
		AllowVolumeBrowserForRegularUsers         bool `json:"AllowVolumeBrowserForRegularUsers"`
		AllowBindMountsForRegularUsers            bool `json:"AllowBindMountsForRegularUsers"`
		AllowPrivilegedModeForRegularUsers        bool `json:"AllowPrivilegedModeForRegularUsers"`
		AllowHostNamespaceForRegularUsers         bool `json:"AllowHostNamespaceForRegularUsers"`
		AllowStackManagementForRegularUsers       bool `json:"AllowStackManagementForRegularUsers"`
		AllowDeviceMappingForRegularUsers         bool `json:"AllowDeviceMappingForRegularUsers"`
		AllowContainerCapabilitiesForRegularUsers bool `json:"AllowContainerCapabilitiesForRegularUsers"`
	}

	/**
	extras
	*/
	// Pair defines a key/value string pair
	Pair struct {
		Name  string `json:"name" example:"name"`
		Value string `json:"value" example:"value"`
	}

	// Feature represents a feature that can be enabled or disabled via feature flags
	Feature string
)
