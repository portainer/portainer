package logforge

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"crypto/tls"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/http/httputil"
	"net/url"
	"sort"
	"strconv"
	"strings"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/authorization"
	"github.com/portainer/portainer/api/internal/endpointutils"
	"github.com/portainer/portainer/api/logs"
	"github.com/portainer/portainer/api/stacks/deployments"
	"github.com/portainer/portainer/api/stacks/stackbuilders"
	"github.com/portainer/portainer/api/stacks/stackutils"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"

	"github.com/gorilla/mux"
	"github.com/rs/zerolog/log"
)

const (
	defaultImage            = "logforge/unicron:portainer-integration"
	defaultRemoteAgentImage = "logforge/unicron-agent:portainer-integration"
	defaultStackName        = "logforge-unicron"
	defaultContainerName    = "logforge-unicron-appliance"
	defaultVolumeName       = "logforge-unicron-data"
	defaultHTTPSPort        = 9444
	defaultMTLSPort         = 8443
	defaultCentralFQDN      = "logforge.local"
	browserProxyPath        = "/logforge/ui/"
	serviceKeyHeader        = "X-LogForge-Service-Key"
	managedByHeader         = "X-LogForge-Managed-By"
	managedIdentityHeader   = "X-LogForge-Managed-Identity"
	managedSignatureHeader  = "X-LogForge-Managed-Identity-Signature"
	managedIdentityTTL      = 5 * time.Minute
	endpointAdminRoleID     = portainer.RoleID(1)
	helpdeskRoleID          = portainer.RoleID(2)
	standardRoleID          = portainer.RoleID(3)
	readOnlyRoleID          = portainer.RoleID(4)
	operatorRoleID          = portainer.RoleID(5)
)

// Handler is the HTTP handler used to handle LogForge integration operations.
type Handler struct {
	*mux.Router
	requestBouncer      security.BouncerService
	DataStore           dataservices.DataStore
	FileService         portainer.FileService
	ComposeStackManager portainer.ComposeStackManager
	StackDeployer       deployments.StackDeployer
	httpClient          *http.Client
}

// NewHandler creates a handler to manage LogForge integration operations.
func NewHandler(bouncer security.BouncerService) *Handler {
	h := &Handler{
		Router:         mux.NewRouter(),
		requestBouncer: bouncer,
		httpClient: &http.Client{
			Timeout: 5 * time.Second,
			Transport: &http.Transport{
				TLSClientConfig: &tls.Config{InsecureSkipVerify: true}, // LogForge appliance uses a local self-signed certificate by default.
			},
		},
	}

	h.Handle("/logforge/status",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.status))).Methods(http.MethodGet)
	h.Handle("/logforge/install",
		bouncer.AdminAccess(httperror.LoggerHandler(h.installOrRegister))).Methods(http.MethodPost)
	h.Handle("/logforge/uninstall",
		bouncer.AdminAccess(httperror.LoggerHandler(h.uninstallOrClear))).Methods(http.MethodPost)

	h.Handle("/logforge/ui",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.proxyUI)))
	h.PathPrefix("/logforge/ui/").Handler(
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.proxyUI)),
	)

	return h
}

type statusResponse struct {
	Enabled              bool                 `json:"Enabled"`
	Managed              bool                 `json:"Managed"`
	ApplianceStackID     portainer.StackID    `json:"ApplianceStackId,omitempty"`
	ApplianceEndpointID  portainer.EndpointID `json:"ApplianceEndpointId,omitempty"`
	ApplianceURL         string               `json:"ApplianceUrl,omitempty"`
	ApplianceHostHeader  string               `json:"ApplianceHostHeader,omitempty"`
	BrowserProxyPath     string               `json:"BrowserProxyPath"`
	ApplianceImage       string               `json:"ApplianceImage,omitempty"`
	StackName            string               `json:"StackName,omitempty"`
	PortainerInstanceID  string               `json:"PortainerInstanceId,omitempty"`
	ServiceKeyPrefix     string               `json:"ServiceKeyPrefix,omitempty"`
	ServiceKeyCreatedAt  int64                `json:"ServiceKeyCreatedAt,omitempty"`
	ServiceKeyLastUsedAt int64                `json:"ServiceKeyLastUsedAt,omitempty"`
	ServiceKeyRotatedAt  int64                `json:"ServiceKeyRotatedAt,omitempty"`
	ManagedAuthReady     bool                 `json:"ManagedAuthReady"`
	Stack                *stackSummary        `json:"Stack,omitempty"`
	Health               healthStatus         `json:"Health"`
	Access               logForgeAccess       `json:"Access"`
}

type stackSummary struct {
	ID         portainer.StackID     `json:"Id"`
	Name       string                `json:"Name"`
	EndpointID portainer.EndpointID  `json:"EndpointId"`
	Status     portainer.StackStatus `json:"Status"`
}

type healthStatus struct {
	Status     string `json:"Status"`
	Message    string `json:"Message,omitempty"`
	StatusCode int    `json:"StatusCode,omitempty"`
	Version    string `json:"Version,omitempty"`
	CheckedAt  int64  `json:"CheckedAt,omitempty"`
}

type logForgeAccess struct {
	Allowed   bool                    `json:"Allowed"`
	IsAdmin   bool                    `json:"IsAdmin"`
	UserID    portainer.UserID        `json:"UserId,omitempty"`
	Username  string                  `json:"Username,omitempty"`
	TeamIDs   []portainer.TeamID      `json:"TeamIds,omitempty"`
	Endpoints []logForgeEndpointScope `json:"Endpoints,omitempty"`
}

type logForgeEndpointScope struct {
	ID     portainer.EndpointID `json:"Id"`
	Name   string               `json:"Name"`
	Role   string               `json:"Role"`
	RoleID portainer.RoleID     `json:"RoleId,omitempty"`
}

type installPayload struct {
	EndpointID          portainer.EndpointID `json:"EndpointId,omitempty"`
	ApplianceURL        string               `json:"ApplianceUrl,omitempty"`
	ApplianceHostHeader string               `json:"ApplianceHostHeader,omitempty"`
	Image               string               `json:"Image,omitempty"`
	StackName           string               `json:"StackName,omitempty"`
	CentralFQDN         string               `json:"CentralFQDN,omitempty"`
	HTTPSPort           int                  `json:"HTTPSPort,omitempty"`
	MTLSPort            int                  `json:"MTLSPort,omitempty"`
	RemoteAgentImage    string               `json:"RemoteAgentImage,omitempty"`
}

func (payload *installPayload) Validate(r *http.Request) error {
	if payload.EndpointID == 0 && strings.TrimSpace(payload.ApplianceURL) == "" {
		return errors.New("EndpointId or ApplianceUrl is required")
	}

	if err := validateNoControlChars(payload.ApplianceURL); err != nil {
		return fmt.Errorf("invalid ApplianceUrl: %w", err)
	}
	if err := validateNoControlChars(payload.ApplianceHostHeader); err != nil {
		return fmt.Errorf("invalid ApplianceHostHeader: %w", err)
	}
	if err := validateHostHeader(payload.ApplianceHostHeader); err != nil {
		return fmt.Errorf("invalid ApplianceHostHeader: %w", err)
	}
	if err := validateNoControlChars(payload.Image); err != nil {
		return fmt.Errorf("invalid Image: %w", err)
	}
	if err := validateNoControlChars(payload.StackName); err != nil {
		return fmt.Errorf("invalid StackName: %w", err)
	}
	if err := validateNoControlChars(payload.CentralFQDN); err != nil {
		return fmt.Errorf("invalid CentralFQDN: %w", err)
	}
	if err := validateNoControlChars(payload.RemoteAgentImage); err != nil {
		return fmt.Errorf("invalid RemoteAgentImage: %w", err)
	}

	if strings.TrimSpace(payload.ApplianceURL) != "" {
		u, err := url.Parse(strings.TrimSpace(payload.ApplianceURL))
		if err != nil || u.Scheme == "" || u.Host == "" {
			return errors.New("ApplianceUrl must be an absolute URL")
		}
		if u.Scheme != "http" && u.Scheme != "https" {
			return errors.New("ApplianceUrl must use http or https")
		}
	}

	if !isValidPort(payload.HTTPSPort) {
		return errors.New("HTTPSPort must be between 1 and 65535")
	}
	if !isValidPort(payload.MTLSPort) {
		return errors.New("MTLSPort must be between 1 and 65535")
	}

	return nil
}

type uninstallPayload struct {
	RemoveManagedStack bool `json:"RemoveManagedStack"`
}

func (payload *uninstallPayload) Validate(r *http.Request) error {
	return nil
}

func (handler *Handler) status(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	settings, err := handler.currentSettings()
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve LogForge settings", err)
	}

	return response.JSON(w, handler.buildStatus(r, settings))
}

func (handler *Handler) installOrRegister(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	payload, err := request.GetPayload[installPayload](r)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	settings, err := handler.currentSettings()
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve LogForge settings", err)
	}

	instanceID, err := handler.DataStore.Version().InstanceID()
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve Portainer instance identifier", err)
	}

	if settings.ServiceKey == "" {
		serviceKey, prefix, err := generateServiceKey()
		if err != nil {
			return httperror.InternalServerError("Unable to generate LogForge service key", err)
		}
		settings.ServiceKey = serviceKey
		settings.ServiceKeyPrefix = prefix
		settings.ServiceKeyCreatedAt = time.Now().Unix()
	}

	settings.Enabled = true
	settings.PortainerInstanceID = instanceID
	settings.BrowserProxyPath = browserProxyPath
	settings.ApplianceImage = valueOrDefault(payload.Image, defaultImage)
	settings.ApplianceHostHeader = applianceHostHeader(payload)

	if payload.EndpointID != 0 {
		stack, endpoint, httpErr := handler.installManagedStack(r, payload, instanceID, settings.ServiceKey)
		if httpErr != nil {
			return httpErr
		}

		settings.Managed = true
		settings.ApplianceStackID = stack.ID
		settings.ApplianceEndpointID = endpoint.ID
		settings.StackName = stack.Name
		settings.ApplianceURL = normalizedApplianceURL(payload.ApplianceURL, payload.HTTPSPort)
	} else {
		settings.Managed = false
		settings.ApplianceStackID = 0
		settings.ApplianceEndpointID = 0
		settings.StackName = ""
		settings.ApplianceURL = normalizeURL(payload.ApplianceURL)
	}

	if settings.ApplianceURL == "" {
		settings.ApplianceURL = normalizedApplianceURL(payload.ApplianceURL, payload.HTTPSPort)
	}

	if err := handler.DataStore.LogForge().UpdateSettings(settings); err != nil {
		return httperror.InternalServerError("Unable to persist LogForge settings", err)
	}

	return response.JSONWithStatus(w, handler.buildStatus(r, settings), http.StatusCreated)
}

func (handler *Handler) uninstallOrClear(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	payload := uninstallPayload{}
	if r.Body != nil && r.ContentLength > 0 {
		if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil {
			return httperror.BadRequest("Invalid request payload", err)
		}
	}

	settings, err := handler.currentSettings()
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve LogForge settings", err)
	}

	if payload.RemoveManagedStack && settings.Managed && settings.ApplianceStackID != 0 {
		if httpErr := handler.removeManagedStack(r.Context(), settings); httpErr != nil {
			return httpErr
		}
	}

	if err := handler.DataStore.LogForge().DeleteSettings(); err != nil && !handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.InternalServerError("Unable to clear LogForge settings", err)
	}

	return response.JSON(w, handler.buildStatus(r, &portainer.LogForgeSettings{}))
}

func (handler *Handler) installManagedStack(r *http.Request, payload *installPayload, instanceID string, serviceKey string) (*portainer.Stack, *portainer.Endpoint, *httperror.HandlerError) {
	if handler.FileService == nil || handler.StackDeployer == nil || handler.ComposeStackManager == nil {
		return nil, nil, httperror.InternalServerError("LogForge managed install is not available", errors.New("stack services are not initialized"))
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(payload.EndpointID)
	if handler.DataStore.IsErrObjectNotFound(err) {
		return nil, nil, httperror.NotFound("Unable to find the target environment", err)
	} else if err != nil {
		return nil, nil, httperror.InternalServerError("Unable to find the target environment", err)
	}

	if !endpointutils.IsDockerEndpoint(endpoint) {
		return nil, nil, httperror.BadRequest("LogForge managed install supports Docker environments only", errors.New("unsupported environment type"))
	}

	if err := handler.requestBouncer.AuthorizedEndpointOperation(r, endpoint); err != nil {
		return nil, nil, httperror.Forbidden("Permission denied to access environment", err)
	}

	tokenData, err := security.RetrieveTokenData(r)
	if err != nil {
		return nil, nil, httperror.InternalServerError("Unable to retrieve user details from authentication token", err)
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return nil, nil, httperror.InternalServerError("Unable to retrieve user info from request context", err)
	}

	stackName := handler.ComposeStackManager.NormalizeStackName(valueOrDefault(payload.StackName, defaultStackName))
	if exists, err := handler.stackNameExists(endpoint.ID, stackName); err != nil {
		return nil, nil, httperror.InternalServerError("Unable to check LogForge stack name", err)
	} else if exists {
		return nil, nil, httperror.Conflict("A stack with the LogForge stack name already exists on the target environment", errors.New("stack already exists"))
	}

	stackPayload := stackbuilders.StackPayload{
		Name:             stackName,
		StackFileContent: []byte(renderManagedCompose(payload, stackName, instanceID, serviceKeySHA256(serviceKey))),
		FromAppTemplate:  false,
	}

	builder := stackbuilders.CreateComposeStackFileBuilder(
		securityContext,
		handler.DataStore,
		handler.FileService,
		handler.StackDeployer,
	)

	stack, httpErr := stackbuilders.BuildAndAsyncDeploy(r.Context(), handler.DataStore, builder, &stackPayload, endpoint, tokenData.ID)
	if httpErr != nil {
		return nil, nil, httpErr
	}

	resourceControl := authorization.NewAdministratorsOnlyResourceControl(
		stackutils.ResourceControlID(stack.EndpointID, stack.Name),
		portainer.StackResourceControl,
	)
	if err := handler.DataStore.ResourceControl().Create(resourceControl); err != nil {
		log.Warn().Err(err).Int("stack_id", int(stack.ID)).Msg("unable to persist LogForge stack resource control")
	}

	return stack, endpoint, nil
}

func (handler *Handler) removeManagedStack(ctx context.Context, settings *portainer.LogForgeSettings) *httperror.HandlerError {
	if handler.StackDeployer == nil || handler.FileService == nil {
		return nil
	}

	stack, err := handler.DataStore.Stack().Read(settings.ApplianceStackID)
	if handler.DataStore.IsErrObjectNotFound(err) {
		return nil
	} else if err != nil {
		return httperror.InternalServerError("Unable to find the managed LogForge stack", err)
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(stack.EndpointID)
	if handler.DataStore.IsErrObjectNotFound(err) {
		return nil
	} else if err != nil {
		return httperror.InternalServerError("Unable to find the managed LogForge environment", err)
	}

	if err := handler.StackDeployer.UndeployComposeStack(ctx, stack, endpoint); err != nil {
		return httperror.InternalServerError("Unable to remove the managed LogForge stack from Docker", err)
	}

	if err := handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		resourceControl, err := tx.ResourceControl().ResourceControlByResourceIDAndType(
			stackutils.ResourceControlID(stack.EndpointID, stack.Name),
			portainer.StackResourceControl,
		)
		if err != nil {
			return err
		}

		if resourceControl != nil {
			if err := tx.ResourceControl().Delete(resourceControl.ID); err != nil {
				return err
			}
		}

		return tx.Stack().Delete(stack.ID)
	}); err != nil {
		return httperror.InternalServerError("Unable to remove the managed LogForge stack from Portainer", err)
	}

	if stack.ProjectPath != "" {
		if err := handler.FileService.RemoveDirectory(stack.ProjectPath); err != nil {
			log.Warn().Err(err).Str("project_path", stack.ProjectPath).Msg("unable to remove LogForge stack files")
		}
	}

	return nil
}

func (handler *Handler) proxyUI(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	settings, err := handler.currentSettings()
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve LogForge settings", err)
	}

	if !settings.Enabled || strings.TrimSpace(settings.ApplianceURL) == "" {
		return httperror.NotFound("LogForge is not configured", errors.New("LogForge is not configured"))
	}

	target, err := url.Parse(settings.ApplianceURL)
	if err != nil || target.Scheme == "" || target.Host == "" {
		return httperror.InternalServerError("LogForge appliance URL is invalid", err)
	}

	access, err := handler.logForgeAccessForRequest(r)
	if err != nil {
		return httperror.InternalServerError("Unable to resolve LogForge access", err)
	}
	if !access.Allowed {
		return httperror.Forbidden("Permission denied to access LogForge", errors.New("no Docker environment access"))
	}

	proxy := handler.newUIProxy(target, settings.ServiceKey, settings.ApplianceHostHeader, access)
	proxy.ServeHTTP(w, r)
	return nil
}

func (handler *Handler) newUIProxy(target *url.URL, serviceKey string, hostHeader string, access logForgeAccess) *httputil.ReverseProxy {
	targetQuery := target.RawQuery
	proxy := httputil.NewSingleHostReverseProxy(target)
	proxy.Transport = &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}
	proxy.Director = func(req *http.Request) {
		req.URL.Scheme = target.Scheme
		req.URL.Host = target.Host
		req.URL.Path = buildUpstreamPath(target.Path, req.URL.Path)
		if targetQuery == "" || req.URL.RawQuery == "" {
			req.URL.RawQuery = targetQuery + req.URL.RawQuery
		} else {
			req.URL.RawQuery = targetQuery + "&" + req.URL.RawQuery
		}
		if strings.HasSuffix(req.URL.Path, "/__manifest") {
			query := req.URL.Query()
			if paths := query.Get("paths"); paths != "" {
				query.Set("paths", buildUpstreamManifestPaths(target.Path, paths))
				req.URL.RawQuery = query.Encode()
			}
		}
		req.Host = valueOrDefault(hostHeader, target.Host)
		// The browser is talking to Portainer, but the upstream enforces a
		// same-origin policy against its own public origin. Present the request as
		// originating from the appliance so HTTP mutations and Socket.IO
		// handshakes are checked against the same authority as req.Host.
		upstreamOrigin := target.Scheme + "://" + req.Host
		if req.Header.Get("Origin") != "" {
			req.Header.Set("Origin", upstreamOrigin)
		}
		if req.Header.Get("Referer") != "" {
			req.Header.Set("Referer", upstreamOrigin+"/")
		}
		req.Header.Set("X-Forwarded-Proto", target.Scheme)
		req.Header.Set("X-Forwarded-Host", req.Host)

		req.Header.Del("Authorization")
		req.Header.Del("X-API-KEY")
		req.Header.Del("Cookie")
		// The proxy rewrites LogForge's /unicron base path in HTML, CSS, and
		// JavaScript responses. Request identity encoding so those response
		// bodies are always available to ModifyResponse as plain bytes.
		req.Header.Set("Accept-Encoding", "identity")
		req.Header.Del(serviceKeyHeader)
		req.Header.Del(managedByHeader)
		req.Header.Del(managedIdentityHeader)
		req.Header.Del(managedSignatureHeader)
		if serviceKey != "" {
			req.Header.Set(serviceKeyHeader, serviceKey)
		}
		identity, signature := signedManagedIdentity(access, serviceKey)
		if identity != "" && signature != "" {
			req.Header.Set(managedByHeader, "portainer")
			req.Header.Set(managedIdentityHeader, identity)
			req.Header.Set(managedSignatureHeader, signature)
		}
	}
	proxy.ModifyResponse = rewriteProxyResponse
	proxy.ErrorHandler = func(rw http.ResponseWriter, req *http.Request, err error) {
		httperror.WriteError(rw, http.StatusBadGateway, "Unable to reach LogForge appliance", err)
	}
	return proxy
}

func rewriteProxyResponse(resp *http.Response) error {
	location := resp.Header.Get("Location")
	if location != "" {
		resp.Header.Set("Location", strings.ReplaceAll(location, "/unicron", browserProxyPath[:len(browserProxyPath)-1]))
	}

	contentType := resp.Header.Get("Content-Type")
	if !shouldRewriteContent(contentType) || resp.Body == nil {
		return nil
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}
	logs.CloseAndLogErr(resp.Body)

	body = bytes.ReplaceAll(body, []byte("/unicron/"), []byte(browserProxyPath))
	body = bytes.ReplaceAll(body, []byte("\"/unicron\""), []byte("\"/logforge/ui\""))
	body = bytes.ReplaceAll(body, []byte("'/unicron'"), []byte("'/logforge/ui'"))

	resp.Body = io.NopCloser(bytes.NewReader(body))
	resp.ContentLength = int64(len(body))
	resp.Header.Set("Content-Length", strconv.Itoa(len(body)))
	return nil
}

func shouldRewriteContent(contentType string) bool {
	contentType = strings.ToLower(contentType)
	return strings.Contains(contentType, "text/html") ||
		strings.Contains(contentType, "text/css") ||
		strings.Contains(contentType, "javascript") ||
		strings.Contains(contentType, "application/json") ||
		strings.Contains(contentType, "application/manifest+json") ||
		strings.Contains(contentType, "text/plain")
}

func (handler *Handler) logForgeAccessForRequest(r *http.Request) (logForgeAccess, error) {
	tokenData, err := security.RetrieveTokenData(r)
	if err != nil {
		return logForgeAccess{}, nil
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		securityContext = &security.RestrictedRequestContext{
			IsAdmin: tokenData.Role == portainer.AdministratorRole,
			UserID:  tokenData.ID,
		}
		if !securityContext.IsAdmin {
			memberships, err := handler.DataStore.TeamMembership().TeamMembershipsByUserID(tokenData.ID)
			if err != nil {
				return logForgeAccess{}, err
			}
			securityContext.UserMemberships = memberships
		}
	}

	access := logForgeAccess{
		IsAdmin:  securityContext.IsAdmin,
		UserID:   tokenData.ID,
		Username: tokenData.Username,
		TeamIDs:  teamIDs(securityContext.UserMemberships),
	}

	endpoints, err := handler.DataStore.Endpoint().Endpoints()
	if err != nil {
		return logForgeAccess{}, err
	}

	groups, err := handler.DataStore.EndpointGroup().ReadAll()
	if err != nil {
		return logForgeAccess{}, err
	}
	groupByID := map[portainer.EndpointGroupID]portainer.EndpointGroup{}
	for _, group := range groups {
		groupByID[group.ID] = group
	}

	for _, endpoint := range endpoints {
		if !endpointutils.IsDockerEndpoint(&endpoint) {
			continue
		}

		endpointGroup, ok := groupByID[endpoint.GroupID]
		if !ok {
			endpointGroup = portainer.EndpointGroup{ID: endpoint.GroupID}
		}

		if !securityContext.IsAdmin && !security.AuthorizedEndpointAccess(&endpoint, &endpointGroup, tokenData.ID, securityContext.UserMemberships) {
			continue
		}

		roleID := readOnlyRoleID
		role := "read_only"
		if securityContext.IsAdmin {
			roleID = endpointAdminRoleID
			role = "admin"
		}
		access.Endpoints = append(access.Endpoints, logForgeEndpointScope{
			ID:     endpoint.ID,
			Name:   endpoint.Name,
			Role:   role,
			RoleID: roleID,
		})
	}

	sort.Slice(access.Endpoints, func(i, j int) bool {
		return access.Endpoints[i].ID < access.Endpoints[j].ID
	})
	access.Allowed = len(access.Endpoints) > 0

	return access, nil
}

func teamIDs(memberships []portainer.TeamMembership) []portainer.TeamID {
	teamSet := map[portainer.TeamID]bool{}
	for _, membership := range memberships {
		teamSet[membership.TeamID] = true
	}

	ids := make([]portainer.TeamID, 0, len(teamSet))
	for teamID := range teamSet {
		ids = append(ids, teamID)
	}
	sort.Slice(ids, func(i, j int) bool {
		return ids[i] < ids[j]
	})

	return ids
}

type managedIdentityClaims struct {
	Issuer    string                         `json:"iss"`
	Subject   string                         `json:"sub"`
	UserID    portainer.UserID               `json:"user_id"`
	Username  string                         `json:"username,omitempty"`
	IsAdmin   bool                           `json:"is_admin"`
	TeamIDs   []portainer.TeamID             `json:"team_ids,omitempty"`
	Endpoints []managedIdentityEndpointScope `json:"endpoints"`
	IssuedAt  int64                          `json:"iat"`
	ExpiresAt int64                          `json:"exp"`
}

type managedIdentityEndpointScope struct {
	ID     portainer.EndpointID `json:"id"`
	Name   string               `json:"name"`
	Role   string               `json:"role"`
	RoleID portainer.RoleID     `json:"role_id,omitempty"`
}

func signedManagedIdentity(access logForgeAccess, serviceKey string) (string, string) {
	if serviceKey == "" || !access.Allowed {
		return "", ""
	}

	now := time.Now()
	claims := managedIdentityClaims{
		Issuer:    "portainer",
		Subject:   fmt.Sprintf("portainer:user:%d", access.UserID),
		UserID:    access.UserID,
		Username:  access.Username,
		IsAdmin:   access.IsAdmin,
		TeamIDs:   access.TeamIDs,
		Endpoints: managedIdentityEndpoints(access.Endpoints),
		IssuedAt:  now.Unix(),
		ExpiresAt: now.Add(managedIdentityTTL).Unix(),
	}

	payload, err := json.Marshal(claims)
	if err != nil {
		return "", ""
	}

	identity := base64.RawURLEncoding.EncodeToString(payload)
	mac := hmac.New(sha256.New, []byte(serviceKey))
	_, _ = mac.Write([]byte(identity))
	signature := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))

	return identity, signature
}

func managedIdentityEndpoints(endpoints []logForgeEndpointScope) []managedIdentityEndpointScope {
	claims := make([]managedIdentityEndpointScope, 0, len(endpoints))
	for _, endpoint := range endpoints {
		claims = append(claims, managedIdentityEndpointScope{
			ID:     endpoint.ID,
			Name:   endpoint.Name,
			Role:   endpoint.Role,
			RoleID: endpoint.RoleID,
		})
	}

	return claims
}

func (handler *Handler) currentSettings() (*portainer.LogForgeSettings, error) {
	settings, err := handler.DataStore.LogForge().Settings()
	if err != nil {
		if handler.DataStore.IsErrObjectNotFound(err) {
			return &portainer.LogForgeSettings{
				BrowserProxyPath: browserProxyPath,
			}, nil
		}
		return nil, err
	}

	if settings.BrowserProxyPath == "" {
		settings.BrowserProxyPath = browserProxyPath
	}

	return settings, nil
}

func (handler *Handler) buildStatus(r *http.Request, settings *portainer.LogForgeSettings) statusResponse {
	access, err := handler.logForgeAccessForRequest(r)
	if err != nil {
		log.Warn().Err(err).Msg("unable to resolve LogForge access")
	}

	status := statusResponse{
		Enabled:              settings.Enabled,
		Managed:              settings.Managed,
		ApplianceStackID:     settings.ApplianceStackID,
		ApplianceEndpointID:  settings.ApplianceEndpointID,
		ApplianceURL:         settings.ApplianceURL,
		ApplianceHostHeader:  settings.ApplianceHostHeader,
		BrowserProxyPath:     valueOrDefault(settings.BrowserProxyPath, browserProxyPath),
		ApplianceImage:       settings.ApplianceImage,
		StackName:            settings.StackName,
		PortainerInstanceID:  settings.PortainerInstanceID,
		ServiceKeyPrefix:     settings.ServiceKeyPrefix,
		ServiceKeyCreatedAt:  settings.ServiceKeyCreatedAt,
		ServiceKeyLastUsedAt: settings.ServiceKeyLastUsedAt,
		ServiceKeyRotatedAt:  settings.ServiceKeyRotatedAt,
		ManagedAuthReady:     settings.ServiceKey != "",
		Health:               handler.checkHealth(r.Context(), settings),
		Access:               access,
	}

	if settings.ApplianceStackID != 0 {
		if stack, err := handler.DataStore.Stack().Read(settings.ApplianceStackID); err == nil {
			status.Stack = &stackSummary{
				ID:         stack.ID,
				Name:       stack.Name,
				EndpointID: stack.EndpointID,
				Status:     stack.Status,
			}
		}
	}

	return status
}

func (handler *Handler) checkHealth(ctx context.Context, settings *portainer.LogForgeSettings) healthStatus {
	checkedAt := time.Now().Unix()
	if !settings.Enabled || strings.TrimSpace(settings.ApplianceURL) == "" {
		return healthStatus{Status: "not_configured", CheckedAt: checkedAt}
	}

	healthURL, err := appendUnicronPath(settings.ApplianceURL, "/api/health")
	if err != nil {
		return healthStatus{Status: "unhealthy", Message: err.Error(), CheckedAt: checkedAt}
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, healthURL, nil)
	if err != nil {
		return healthStatus{Status: "unhealthy", Message: err.Error(), CheckedAt: checkedAt}
	}
	if settings.ServiceKey != "" {
		req.Header.Set(serviceKeyHeader, settings.ServiceKey)
	}
	if settings.ApplianceHostHeader != "" {
		req.Host = settings.ApplianceHostHeader
	}

	resp, err := handler.httpClient.Do(req)
	if err != nil {
		return healthStatus{Status: "unhealthy", Message: err.Error(), CheckedAt: checkedAt}
	}
	defer logs.CloseAndLogErr(resp.Body)

	body, _ := io.ReadAll(io.LimitReader(resp.Body, 1024))
	if resp.StatusCode < 200 || resp.StatusCode >= 400 {
		return healthStatus{
			Status:     "unhealthy",
			Message:    strings.TrimSpace(string(body)),
			StatusCode: resp.StatusCode,
			CheckedAt:  checkedAt,
		}
	}

	message := strings.TrimSpace(string(body))
	health := healthStatus{
		Status:     "healthy",
		Message:    message,
		StatusCode: resp.StatusCode,
		CheckedAt:  checkedAt,
	}
	if strings.Contains(message, `"version"`) {
		health.Version = extractJSONValue(message, "version")
	}
	return health
}

func (handler *Handler) stackNameExists(endpointID portainer.EndpointID, stackName string) (bool, error) {
	stacks, err := handler.DataStore.Stack().ReadAll()
	if err != nil {
		return false, err
	}

	for _, stack := range stacks {
		if stack.EndpointID == endpointID && strings.EqualFold(stack.Name, stackName) {
			return true, nil
		}
	}

	return false, nil
}

func renderManagedCompose(payload *installPayload, stackName string, instanceID string, serviceKeyVerifier string) string {
	image := valueOrDefault(payload.Image, defaultImage)
	httpsPort := valueOrDefaultInt(payload.HTTPSPort, defaultHTTPSPort)
	mtlsPort := valueOrDefaultInt(payload.MTLSPort, defaultMTLSPort)
	centralFQDN := valueOrDefault(payload.CentralFQDN, defaultCentralFQDN)
	remoteAgentImage := valueOrDefault(payload.RemoteAgentImage, defaultRemoteAgentImage)
	portainerInstanceID := valueOrDefault(instanceID, "portainer")

	return fmt.Sprintf(`services:
  unicron:
    image: %s
    container_name: %s
    restart: unless-stopped
    read_only: true
    tmpfs:
      - /tmp:rw,nosuid,nodev,mode=1777,size=256m
      - /run:rw,nosuid,nodev,mode=755,size=64m
      - /run/pyinstaller:rw,nosuid,nodev,exec,mode=1777,size=256m
    cap_drop:
      - ALL
    cap_add:
      - CHOWN
      - DAC_OVERRIDE
      - FOWNER
      - KILL
      - SETGID
      - SETUID
      - NET_BIND_SERVICE
    security_opt:
      - no-new-privileges:true
    extra_hosts:
      - unicron-stepca:127.0.0.1
      - unicron-stepca-ra:127.0.0.1
      - unicron.central:127.0.0.1
      - %s:127.0.0.1
    ports:
      - "%d:443"
      - "%d:8443"
    environment:
      UNICRON_MANAGED_BY: portainer
      UNICRON_SELF_UPDATE_ENABLED: "false"
      UNICRON_MANAGED_EXTERNAL_AUTH_ENABLED: "true"
      UNICRON_MANAGED_EXTERNAL_AUTH_PROVIDER: portainer
      UNICRON_MANAGED_IDENTITY_HEADER: %s
      UNICRON_MANAGED_IDENTITY_SIGNATURE_HEADER: %s
      UNICRON_MANAGED_SERVICE_KEY_HEADER: %s
      UNICRON_MANAGED_SERVICE_KEY_SHA256: %s
      UNICRON_CENTRAL_FQDN: %s
      UNICRON_PUBLIC_CENTRAL_PORT: "%d"
      UNICRON_PUBLIC_CENTRAL_MTLS_PORT: "%d"
      LOCAL_AGENT_DOCKER_NETWORK: %s_default
      UNICRON_APPLIANCE_CONTAINER_NAME: %s
      PORTAINER_INSTANCE_ID: %s
      TMPDIR: /run/pyinstaller
      CENTRAL_ADMIN_RECOVERY_OVERRIDE: "false"
      REMOTE_AGENT_IMAGE: %s
    networks:
      default:
        aliases:
          - unicron.central
    volumes:
      - %s:/var/lib/unicron
    healthcheck:
      test: ["CMD", "/usr/local/bin/unicron-appliance-manager", "healthcheck"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 120s

volumes:
  %s:
    name: %s
`, image, defaultContainerName, centralFQDN, httpsPort, mtlsPort, managedIdentityHeader, managedSignatureHeader, serviceKeyHeader, serviceKeyVerifier, centralFQDN, httpsPort, mtlsPort, stackName, defaultContainerName, portainerInstanceID, remoteAgentImage, defaultVolumeName, defaultVolumeName, defaultVolumeName)
}

func serviceKeySHA256(serviceKey string) string {
	sum := sha256.Sum256([]byte(serviceKey))
	return fmt.Sprintf("%x", sum[:])
}

func generateServiceKey() (string, string, error) {
	key := make([]byte, 32)
	if _, err := rand.Read(key); err != nil {
		return "", "", err
	}

	encoded := "lfp_" + base64.RawURLEncoding.EncodeToString(key)
	prefixLen := 12
	if len(encoded) < prefixLen {
		prefixLen = len(encoded)
	}
	return encoded, encoded[:prefixLen], nil
}

func normalizedApplianceURL(raw string, httpsPort int) string {
	if normalized := normalizeURL(raw); normalized != "" {
		return normalized
	}
	return fmt.Sprintf("https://127.0.0.1:%d", valueOrDefaultInt(httpsPort, defaultHTTPSPort))
}

func normalizeURL(raw string) string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return ""
	}

	u, err := url.Parse(raw)
	if err != nil {
		return raw
	}

	u.Path = strings.TrimRight(u.Path, "/")
	u.RawQuery = ""
	u.Fragment = ""
	return u.String()
}

func applianceHostHeader(payload *installPayload) string {
	if normalized := normalizeHostHeader(payload.ApplianceHostHeader); normalized != "" {
		return normalized
	}
	if payload.EndpointID != 0 {
		return normalizeHostHeader(payload.CentralFQDN)
	}
	return ""
}

func normalizeHostHeader(raw string) string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return ""
	}

	if strings.Contains(raw, "://") {
		if u, err := url.Parse(raw); err == nil {
			return u.Host
		}
	}

	return strings.TrimRight(raw, "/")
}

func validateHostHeader(value string) error {
	value = normalizeHostHeader(value)
	if value == "" {
		return nil
	}

	if strings.ContainsAny(value, " \\/") {
		return errors.New("host header must not contain whitespace or path separators")
	}

	return nil
}

func appendUnicronPath(raw string, suffix string) (string, error) {
	u, err := url.Parse(raw)
	if err != nil {
		return "", err
	}

	basePath := strings.TrimRight(u.Path, "/")
	if !strings.HasSuffix(basePath, "/unicron") {
		basePath += "/unicron"
	}
	u.Path = singleJoiningSlash(basePath, suffix)
	u.RawQuery = ""
	return u.String(), nil
}

func buildUpstreamPath(targetPath string, requestPath string) string {
	basePath := upstreamBasePath(targetPath)

	rest := strings.TrimPrefix(requestPath, "/logforge/ui")
	if rest == "" {
		rest = "/"
	}

	return singleJoiningSlash(basePath, rest)
}

func buildUpstreamManifestPaths(targetPath string, rawPaths string) string {
	basePath := upstreamBasePath(targetPath)
	proxyBasePath := strings.TrimRight(browserProxyPath, "/")
	paths := strings.Split(rawPaths, ",")
	for index, path := range paths {
		path = strings.TrimSpace(path)
		if path == basePath || strings.HasPrefix(path, basePath+"/") {
			paths[index] = path
			continue
		}
		if path == proxyBasePath {
			paths[index] = basePath
			continue
		}
		if strings.HasPrefix(path, proxyBasePath+"/") {
			paths[index] = basePath + strings.TrimPrefix(path, proxyBasePath)
			continue
		}
		paths[index] = singleJoiningSlash(basePath, path)
	}
	return strings.Join(paths, ",")
}

func upstreamBasePath(targetPath string) string {
	basePath := strings.TrimRight(targetPath, "/")
	if !strings.HasSuffix(basePath, "/unicron") {
		basePath += "/unicron"
	}
	return basePath
}

func singleJoiningSlash(a, b string) string {
	aslash := strings.HasSuffix(a, "/")
	bslash := strings.HasPrefix(b, "/")
	switch {
	case aslash && bslash:
		return a + b[1:]
	case !aslash && !bslash:
		return a + "/" + b
	}
	return a + b
}

func valueOrDefault(value string, fallback string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return fallback
	}
	return value
}

func valueOrDefaultInt(value int, fallback int) int {
	if value <= 0 {
		return fallback
	}
	return value
}

func isValidPort(value int) bool {
	return value == 0 || (value >= 1 && value <= 65535)
}

func validateNoControlChars(value string) error {
	for _, r := range value {
		if r == '\n' || r == '\r' || r == '\t' {
			return errors.New("control characters are not allowed")
		}
	}
	return nil
}

func extractJSONValue(body string, key string) string {
	token := `"` + key + `":`
	idx := strings.Index(body, token)
	if idx == -1 {
		return ""
	}
	rest := strings.TrimSpace(body[idx+len(token):])
	if !strings.HasPrefix(rest, `"`) {
		return ""
	}
	rest = rest[1:]
	end := strings.Index(rest, `"`)
	if end == -1 {
		return ""
	}
	return rest[:end]
}
