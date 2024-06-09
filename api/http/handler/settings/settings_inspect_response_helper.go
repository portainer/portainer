package settings

import (
	"fmt"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/pkg/featureflags"
	"golang.org/x/oauth2"
)

type settingsInspectResponse struct {
	adminResponse
}

type authenticatedResponse struct {
	publicSettingsResponse

	// Deployment options for encouraging git ops workflows
	GlobalDeploymentOptions portainer.GlobalDeploymentOptions `json:"GlobalDeploymentOptions"`
	// Whether edge compute features are enabled
	EnableEdgeComputeFeatures bool `json:"EnableEdgeComputeFeatures"`
	// The expiry of a Kubeconfig
	KubeconfigExpiry string `json:"KubeconfigExpiry" example:"24h"`

	// Helm repository URL, defaults to "https://charts.bitnami.com/bitnami"
	HelmRepositoryURL string `json:"HelmRepositoryURL" example:"https://charts.bitnami.com/bitnami"`

	IsAMTEnabled bool `json:"isAMTEnabled"`
	IsFDOEnabled bool `json:"isFDOEnabled"`
}

type edgeSettings struct {
	// The command list interval for edge agent - used in edge async mode (in seconds)
	CommandInterval int `json:"CommandInterval" example:"5"`
	// The ping interval for edge agent - used in edge async mode (in seconds)
	PingInterval int `json:"PingInterval" example:"5"`
	// The snapshot interval for edge agent - used in edge async mode (in seconds)
	SnapshotInterval int `json:"SnapshotInterval" example:"5"`
}

type edgeAdminResponse struct {
	authenticatedResponse

	Edge edgeSettings

	// TrustOnFirstConnect makes Portainer accepting edge agent connection by default
	TrustOnFirstConnect bool `json:"TrustOnFirstConnect" example:"false"`
	// EnforceEdgeID makes Portainer store the Edge ID instead of accepting anyone
	EnforceEdgeID bool `json:"EnforceEdgeID" example:"false"`

	// EdgePortainerURL is the URL that is exposed to edge agents
	EdgePortainerURL string `json:"EdgePortainerUrl"`

	// The default check in interval for edge agent (in seconds)
	EdgeAgentCheckinInterval int `json:"EdgeAgentCheckinInterval" example:"5"`
}

type oauthSettings struct {
	ClientID             string           `json:"ClientID"`
	AccessTokenURI       string           `json:"AccessTokenURI"`
	AuthorizationURI     string           `json:"AuthorizationURI"`
	ResourceURI          string           `json:"ResourceURI"`
	RedirectURI          string           `json:"RedirectURI"`
	UserIdentifier       string           `json:"UserIdentifier"`
	Scopes               string           `json:"Scopes"`
	OAuthAutoCreateUsers bool             `json:"OAuthAutoCreateUsers"`
	DefaultTeamID        portainer.TeamID `json:"DefaultTeamID"`
	SSO                  bool             `json:"SSO"`
	LogoutURI            string           `json:"LogoutURI"`
	AuthStyle            oauth2.AuthStyle `json:"AuthStyle"`
}

type ldapSettings struct {
	// Enable this option if the server is configured for Anonymous access. When enabled, ReaderDN and Password will not be used
	AnonymousMode bool `json:"AnonymousMode" example:"true" validate:"validate_bool"`
	// Account that will be used to search for users
	ReaderDN string `json:"ReaderDN" example:"cn=readonly-account,dc=ldap,dc=domain,dc=tld" validate:"required_if=AnonymousMode false"`
	// URL or IP address of the LDAP server
	URL       string                     `json:"URL" example:"myldap.domain.tld:389" validate:"hostname_port"`
	TLSConfig portainer.TLSConfiguration `json:"TLSConfig"`
	// Whether LDAP connection should use StartTLS
	StartTLS            bool                                `json:"StartTLS" example:"true"`
	SearchSettings      []portainer.LDAPSearchSettings      `json:"SearchSettings"`
	GroupSearchSettings []portainer.LDAPGroupSearchSettings `json:"GroupSearchSettings"`
	// Automatically provision users and assign them to matching LDAP group names
	AutoCreateUsers bool `json:"AutoCreateUsers" example:"true"`
}

type adminResponse struct {
	edgeAdminResponse
	// A list of label name & value that will be used to hide containers when querying containers
	BlackListedLabels []portainer.Pair `json:"BlackListedLabels"`

	LDAPSettings         ldapSettings                   `json:"LDAPSettings"`
	OAuthSettings        oauthSettings                  `json:"OAuthSettings"`
	InternalAuthSettings portainer.InternalAuthSettings `json:"InternalAuthSettings"`
	OpenAMTConfiguration portainer.OpenAMTConfiguration `json:"openAMTConfiguration"`
	FDOConfiguration     portainer.FDOConfiguration     `json:"fdoConfiguration"`
	// The interval in which environment(endpoint) snapshots are created
	SnapshotInterval string `json:"SnapshotInterval" example:"5m"`
	// URL to the templates that will be displayed in the UI when navigating to App Templates
	TemplatesURL string `json:"TemplatesURL" example:"https://raw.githubusercontent.com/portainer/templates/v3/templates.json"`
	// The duration of a user session
	UserSessionTimeout string `json:"UserSessionTimeout" example:"5m"`
	// KubectlImage, defaults to portainer/kubectl-shell
	KubectlShellImage string `json:"KubectlShellImage" example:"portainer/kubectl-shell"`
	// Container environment parameter AGENT_SECRET
	AgentSecret string `json:"AgentSecret"`
}

type publicSettingsResponse struct {
	// global settings

	// URL to a logo that will be displayed on the login page as well as on top of the sidebar. Will use default Portainer logo when value is empty string
	LogoURL string `json:"LogoURL" example:"https://mycompany.mydomain.tld/logo.png"`
	// Whether telemetry is enabled
	EnableTelemetry bool `json:"EnableTelemetry" example:"true"`

	// login settings:

	// Active authentication method for the Portainer instance. Valid values are: 1 for internal, 2 for LDAP, or 3 for oauth
	AuthenticationMethod portainer.AuthenticationMethod `json:"AuthenticationMethod" example:"1"`
	// The URL used for oauth login
	OAuthLoginURI string `json:"OAuthLoginURI" example:"https://gitlab.com/oauth"`
	// The minimum required length for a password of any user when using internal auth mode
	RequiredPasswordLength int `json:"RequiredPasswordLength" example:"1"`
	// The URL used for oauth logout
	OAuthLogoutURI string `json:"OAuthLogoutURI" example:"https://gitlab.com/oauth/logout"`
	// Whether team sync is enabled
	TeamSync bool `json:"TeamSync" example:"true"`
	// Supported feature flags
	Features map[featureflags.Feature]bool `json:"Features"`

	// Deprecated
	// please use `GET /api/settings`
	GlobalDeploymentOptions portainer.GlobalDeploymentOptions `json:"GlobalDeploymentOptions"`
	// Deprecated
	// please use `GET /api/settings`
	ShowKomposeBuildOption bool `json:"ShowKomposeBuildOption" example:"false"`
	// Deprecated
	// please use `GET /api/settings`
	EnableEdgeComputeFeatures bool `json:"EnableEdgeComputeFeatures" example:"true"`

	// Deprecated
	// please use `GET /api/settings`
	KubeconfigExpiry string `example:"24h" default:"0"`
	// Deprecated
	// please use `GET /api/settings`
	IsFDOEnabled bool
	// Deprecated
	// please use `GET /api/settings`
	IsAMTEnabled bool

	// Deprecated
	// please use `GET /api/settings`
	Edge struct {
		// Deprecated
		// please use `GET /api/settings`
		PingInterval int `json:"PingInterval" example:"60"`
		// Deprecated
		// please use `GET /api/settings`
		SnapshotInterval int `json:"SnapshotInterval" example:"60"`
		// Deprecated
		// please use `GET /api/settings`
		CommandInterval int `json:"CommandInterval" example:"60"`
		// Deprecated
		// please use `GET /api/settings`
		CheckinInterval int `example:"60"`
	}
}

func (res *settingsInspectResponse) ForRole(role portainer.UserRole) interface{} {
	switch role {
	case portainer.AdministratorRole:
		return res.adminResponse
	case portainer.EdgeAdminRole:
		return res.edgeAdminResponse
	case portainer.StandardUserRole:
		return res.authenticatedResponse
	default:
		return res.publicSettingsResponse
	}
}

func buildResponse(settings *portainer.Settings) settingsInspectResponse {
	hideFields(settings)

	return settingsInspectResponse{
		adminResponse: adminResponse{
			edgeAdminResponse: edgeAdminResponse{
				authenticatedResponse: authenticatedResponse{
					publicSettingsResponse: generatePublicSettings(settings),

					GlobalDeploymentOptions:   settings.GlobalDeploymentOptions,
					EnableEdgeComputeFeatures: settings.EnableEdgeComputeFeatures,
					KubeconfigExpiry:          settings.KubeconfigExpiry,
					HelmRepositoryURL:         settings.HelmRepositoryURL,
					IsAMTEnabled:              settings.EnableEdgeComputeFeatures && settings.OpenAMTConfiguration.Enabled,
					IsFDOEnabled:              settings.EnableEdgeComputeFeatures && settings.FDOConfiguration.Enabled,
				},

				Edge: edgeSettings{
					CommandInterval:  settings.Edge.CommandInterval,
					PingInterval:     settings.Edge.PingInterval,
					SnapshotInterval: settings.Edge.SnapshotInterval,
				},
				TrustOnFirstConnect:      settings.TrustOnFirstConnect,
				EnforceEdgeID:            settings.EnforceEdgeID,
				EdgePortainerURL:         settings.EdgePortainerURL,
				EdgeAgentCheckinInterval: settings.EdgeAgentCheckinInterval,
			},
			BlackListedLabels: settings.BlackListedLabels,
			LDAPSettings: ldapSettings{
				AnonymousMode:       settings.LDAPSettings.AnonymousMode,
				ReaderDN:            settings.LDAPSettings.ReaderDN,
				TLSConfig:           settings.LDAPSettings.TLSConfig,
				StartTLS:            settings.LDAPSettings.StartTLS,
				SearchSettings:      settings.LDAPSettings.SearchSettings,
				GroupSearchSettings: settings.LDAPSettings.GroupSearchSettings,
				AutoCreateUsers:     settings.LDAPSettings.AutoCreateUsers,
				URL:                 settings.LDAPSettings.URL,
			},
			OAuthSettings: oauthSettings{
				ClientID:             settings.OAuthSettings.ClientID,
				AccessTokenURI:       settings.OAuthSettings.AccessTokenURI,
				AuthorizationURI:     settings.OAuthSettings.AuthorizationURI,
				ResourceURI:          settings.OAuthSettings.ResourceURI,
				RedirectURI:          settings.OAuthSettings.RedirectURI,
				UserIdentifier:       settings.OAuthSettings.UserIdentifier,
				Scopes:               settings.OAuthSettings.Scopes,
				OAuthAutoCreateUsers: settings.OAuthSettings.OAuthAutoCreateUsers,
				DefaultTeamID:        settings.OAuthSettings.DefaultTeamID,
				SSO:                  settings.OAuthSettings.SSO,
				LogoutURI:            settings.OAuthSettings.LogoutURI,
				AuthStyle:            settings.OAuthSettings.AuthStyle,
			},
			InternalAuthSettings: settings.InternalAuthSettings,
			OpenAMTConfiguration: settings.OpenAMTConfiguration,
			FDOConfiguration:     settings.FDOConfiguration,
			SnapshotInterval:     settings.SnapshotInterval,
			TemplatesURL:         settings.TemplatesURL,
			UserSessionTimeout:   settings.UserSessionTimeout,
			KubectlShellImage:    settings.KubectlShellImage,
			AgentSecret:          settings.AgentSecret,
		},
	}
}

func getTeamSync(settings *portainer.Settings) bool {
	if settings.AuthenticationMethod == portainer.AuthenticationLDAP {
		return settings.LDAPSettings.GroupSearchSettings != nil && len(settings.LDAPSettings.GroupSearchSettings) > 0 && len(settings.LDAPSettings.GroupSearchSettings[0].GroupBaseDN) > 0
	}

	return false
}

func generatePublicSettings(appSettings *portainer.Settings) publicSettingsResponse {
	publicSettings := publicSettingsResponse{
		LogoURL:                   appSettings.LogoURL,
		AuthenticationMethod:      appSettings.AuthenticationMethod,
		RequiredPasswordLength:    appSettings.InternalAuthSettings.RequiredPasswordLength,
		EnableEdgeComputeFeatures: appSettings.EnableEdgeComputeFeatures,
		GlobalDeploymentOptions:   appSettings.GlobalDeploymentOptions,
		ShowKomposeBuildOption:    appSettings.ShowKomposeBuildOption,
		EnableTelemetry:           appSettings.EnableTelemetry,
		KubeconfigExpiry:          appSettings.KubeconfigExpiry,
		Features:                  featureflags.FeatureFlags(),
		IsFDOEnabled:              appSettings.EnableEdgeComputeFeatures && appSettings.FDOConfiguration.Enabled,
		IsAMTEnabled:              appSettings.EnableEdgeComputeFeatures && appSettings.OpenAMTConfiguration.Enabled,
		TeamSync:                  getTeamSync(appSettings),
	}

	publicSettings.Edge.PingInterval = appSettings.Edge.PingInterval
	publicSettings.Edge.SnapshotInterval = appSettings.Edge.SnapshotInterval
	publicSettings.Edge.CommandInterval = appSettings.Edge.CommandInterval
	publicSettings.Edge.CheckinInterval = appSettings.EdgeAgentCheckinInterval

	//if OAuth authentication is on, compose the related fields from application settings
	if publicSettings.AuthenticationMethod == portainer.AuthenticationOAuth {
		publicSettings.OAuthLogoutURI = appSettings.OAuthSettings.LogoutURI
		publicSettings.OAuthLoginURI = fmt.Sprintf("%s?response_type=code&client_id=%s&redirect_uri=%s&scope=%s",
			appSettings.OAuthSettings.AuthorizationURI,
			appSettings.OAuthSettings.ClientID,
			appSettings.OAuthSettings.RedirectURI,
			appSettings.OAuthSettings.Scopes)

		//control prompt=login param according to the SSO setting
		if !appSettings.OAuthSettings.SSO {
			publicSettings.OAuthLoginURI += "&prompt=login"
		}
	}

	return publicSettings
}
