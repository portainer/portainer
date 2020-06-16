package auth

import (
	"encoding/json"
	"github.com/portainer/portainer/api/bolt/errors"
	"github.com/portainer/portainer/api/internal/authorization"
	"io/ioutil"
	"log"
	"net/http"

	"github.com/asaskevich/govalidator"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/portainer/api"
)

type oauthPayload struct {
	Code string
}

func (payload *oauthPayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Code) {
		return portainer.Error("Invalid OAuth authorization code")
	}
	return nil
}

func (handler *Handler) authenticateThroughExtension(code, licenseKey string, settings *portainer.OAuthSettings) (string, error) {
	extensionURL := handler.ProxyManager.GetExtensionURL(portainer.OAuthAuthenticationExtension)

	encodedConfiguration, err := json.Marshal(settings)
	if err != nil {
		return "", nil
	}

	req, err := http.NewRequest("GET", extensionURL+"/validate", nil)
	if err != nil {
		return "", err
	}

	client := &http.Client{}
	req.Header.Set("X-OAuth-Config", string(encodedConfiguration))
	req.Header.Set("X-OAuth-Code", code)
	req.Header.Set("X-PortainerExtension-License", licenseKey)

	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}

	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	type extensionResponse struct {
		Username string `json:"Username,omitempty"`
		Err      string `json:"err,omitempty"`
		Details  string `json:"details,omitempty"`
	}

	var extResp extensionResponse
	err = json.Unmarshal(body, &extResp)
	if err != nil {
		return "", err
	}

	if resp.StatusCode != http.StatusOK {
		return "", portainer.Error(extResp.Err + ":" + extResp.Details)
	}

	return extResp.Username, nil
}

func (handler *Handler) validateOAuth(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload oauthPayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	settings, err := handler.DataStore.Settings().Settings()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve settings from the database", err}
	}

	if settings.AuthenticationMethod != 3 {
		return &httperror.HandlerError{http.StatusForbidden, "OAuth authentication is not enabled", portainer.Error("OAuth authentication is not enabled")}
	}

	extension, err := handler.DataStore.Extension().Extension(portainer.OAuthAuthenticationExtension)
	if err == errors.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Oauth authentication extension is not enabled", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a extension with the specified identifier inside the database", err}
	}

	username, err := handler.authenticateThroughExtension(payload.Code, extension.License.LicenseKey, &settings.OAuthSettings)
	if err != nil {
		log.Printf("[DEBUG] - OAuth authentication error: %s", err)
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to authenticate through OAuth", portainer.ErrUnauthorized}
	}

	user, err := handler.DataStore.User().UserByUsername(username)
	if err != nil && err != errors.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve a user with the specified username from the database", err}
	}

	if user == nil && !settings.OAuthSettings.OAuthAutoCreateUsers {
		return &httperror.HandlerError{http.StatusForbidden, "Account not created beforehand in Portainer and automatic user provisioning not enabled", portainer.ErrUnauthorized}
	}

	if user == nil {
		user = &portainer.User{
			Username:                username,
			Role:                    portainer.StandardUserRole,
			PortainerAuthorizations: authorization.DefaultPortainerAuthorizations(),
		}

		err = handler.DataStore.User().CreateUser(user)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist user inside the database", err}
		}

		if settings.OAuthSettings.DefaultTeamID != 0 {
			membership := &portainer.TeamMembership{
				UserID: user.ID,
				TeamID: settings.OAuthSettings.DefaultTeamID,
				Role:   portainer.TeamMember,
			}

			err = handler.DataStore.TeamMembership().CreateTeamMembership(membership)
			if err != nil {
				return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist team membership inside the database", err}
			}
		}

		err = handler.AuthorizationService.UpdateUsersAuthorizations()
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to update user authorizations", err}
		}
	}

	return handler.writeToken(w, user)
}
