package users

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/internal/authorization"
	"github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/portainer/portainer/api/jwt"

	"github.com/stretchr/testify/require"
)

type hashHookCryptoService struct {
	portainer.CryptoService
	beforeHash func()
}

func (s hashHookCryptoService) Hash(data string) (string, error) {
	s.beforeHash()

	return s.CryptoService.Hash(data)
}

func demoteUser(t *testing.T, h *Handler, jwtService *jwt.Service, actor *portainer.User, targetID portainer.UserID) int {
	t.Helper()

	return updateUser(t, h, jwtService, actor, targetID, userUpdatePayload{Role: int(portainer.StandardUserRole)})
}

func updateUser(t *testing.T, h *Handler, jwtService *jwt.Service, actor *portainer.User, targetID portainer.UserID, payload userUpdatePayload) int {
	t.Helper()

	body, err := json.Marshal(payload)
	require.NoError(t, err)

	token, _, err := jwtService.GenerateToken(&portainer.TokenData{ID: actor.ID, Username: actor.Username, Role: actor.Role})
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodPut, fmt.Sprintf("/users/%d", targetID), bytes.NewBuffer(body))
	testhelpers.AddTestSecurityCookie(req, token)

	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)

	return rr.Code
}

func countAdmins(t *testing.T, store *datastore.Store) int {
	t.Helper()

	admins, err := store.User().UsersByRole(portainer.AdministratorRole)
	require.NoError(t, err)

	return len(admins)
}

func Test_userUpdate_LastAdmin(t *testing.T) {
	t.Parallel()

	_, store := datastore.MustNewTestStore(t, true, true)

	admin := &portainer.User{ID: 1, Username: "admin", Role: portainer.AdministratorRole}
	require.NoError(t, store.User().Create(admin))

	second := &portainer.User{ID: 2, Username: "second", Role: portainer.AdministratorRole}
	require.NoError(t, store.User().Create(second))

	h, jwtService, _ := newTestHandler(t, store)

	require.Equal(t, http.StatusOK, demoteUser(t, h, jwtService, admin, second.ID))
	require.Equal(t, 1, countAdmins(t, store))

	require.Equal(t, http.StatusConflict, demoteUser(t, h, jwtService, admin, admin.ID))
	require.Equal(t, 1, countAdmins(t, store))
}

func Test_userUpdate_ConcurrentDemotionsKeepAnAdmin(t *testing.T) {
	t.Parallel()

	_, store := datastore.MustNewTestStore(t, true, true)

	first := &portainer.User{ID: 1, Username: "first", Role: portainer.AdministratorRole}
	require.NoError(t, store.User().Create(first))

	second := &portainer.User{ID: 2, Username: "second", Role: portainer.AdministratorRole}
	require.NoError(t, store.User().Create(second))

	h, jwtService, _ := newTestHandler(t, store)

	var wg sync.WaitGroup
	wg.Go(func() { demoteUser(t, h, jwtService, first, second.ID) })
	wg.Go(func() { demoteUser(t, h, jwtService, second, first.ID) })
	wg.Wait()

	require.Equal(t, 1, countAdmins(t, store))
}

func Test_deleteAdminUser_LastAdmin(t *testing.T) {
	t.Parallel()

	_, store := datastore.MustNewTestStore(t, true, true)

	demoted := &portainer.User{ID: 1, Username: "demoted", Role: portainer.StandardUserRole}
	require.NoError(t, store.User().Create(demoted))

	oauthAdmin := &portainer.User{ID: 2, Username: "oauth-admin", Role: portainer.AdministratorRole}
	require.NoError(t, store.User().Create(oauthAdmin))

	h, _, _ := newTestHandler(t, store)
	h.AuthorizationService = authorization.NewService(store)

	httpErr := h.deleteAdminUser(httptest.NewRecorder(), oauthAdmin)
	require.NotNil(t, httpErr)
	require.Equal(t, http.StatusConflict, httpErr.StatusCode)
	require.Equal(t, 1, countAdmins(t, store))
}

func Test_userUpdate_TargetPromotedDuringRequest(t *testing.T) {
	t.Parallel()

	_, store := datastore.MustNewTestStore(t, true, true)

	admin := &portainer.User{ID: 1, Username: "admin", Role: portainer.AdministratorRole}
	require.NoError(t, store.User().Create(admin))

	target := &portainer.User{ID: 2, Username: "target", Role: portainer.StandardUserRole}
	require.NoError(t, store.User().Create(target))

	h, jwtService, _ := newTestHandler(t, store)
	h.CryptoService = hashHookCryptoService{
		CryptoService: testhelpers.NewCryptoService(),
		beforeHash: func() {
			promoted := *target
			promoted.Username = "renamed"
			promoted.Role = portainer.AdministratorRole
			require.NoError(t, store.User().Update(promoted.ID, &promoted))

			demoted := *admin
			demoted.Role = portainer.StandardUserRole
			require.NoError(t, store.User().Update(demoted.ID, &demoted))
		},
	}

	require.Equal(t, http.StatusOK, updateUser(t, h, jwtService, admin, target.ID, userUpdatePayload{NewPassword: "a-long-enough-password"}))

	stored, err := store.User().Read(target.ID)
	require.NoError(t, err)
	require.Equal(t, "renamed", stored.Username)
	require.Equal(t, portainer.AdministratorRole, stored.Role)
	require.Equal(t, 1, countAdmins(t, store))
}

func Test_deleteUser_TargetPromotedDuringRequest(t *testing.T) {
	t.Parallel()

	_, store := datastore.MustNewTestStore(t, true, true)

	demoted := &portainer.User{ID: 1, Username: "demoted", Role: portainer.StandardUserRole}
	require.NoError(t, store.User().Create(demoted))

	promoted := &portainer.User{ID: 2, Username: "promoted", Role: portainer.AdministratorRole}
	require.NoError(t, store.User().Create(promoted))

	h, _, _ := newTestHandler(t, store)
	h.AuthorizationService = authorization.NewService(store)

	readBeforePromotion := &portainer.User{ID: promoted.ID, Username: promoted.Username, Role: portainer.StandardUserRole}

	httpErr := h.deleteUser(httptest.NewRecorder(), readBeforePromotion)
	require.NotNil(t, httpErr)
	require.Equal(t, http.StatusConflict, httpErr.StatusCode)
	require.Equal(t, 1, countAdmins(t, store))
}

func Test_userUpdatePassword_UserPromotedDuringRequest(t *testing.T) {
	t.Parallel()

	_, store := datastore.MustNewTestStore(t, true, true)

	admin := &portainer.User{ID: 1, Username: "admin", Role: portainer.AdministratorRole}
	require.NoError(t, store.User().Create(admin))

	target := &portainer.User{ID: 2, Username: "target", Role: portainer.StandardUserRole}
	require.NoError(t, store.User().Create(target))

	h, jwtService, _ := newTestHandler(t, store)
	h.CryptoService = hashHookCryptoService{
		CryptoService: testhelpers.NewCryptoService(),
		beforeHash: func() {
			promoted := *target
			promoted.Role = portainer.AdministratorRole
			require.NoError(t, store.User().Update(promoted.ID, &promoted))

			demoted := *admin
			demoted.Role = portainer.StandardUserRole
			require.NoError(t, store.User().Update(demoted.ID, &demoted))
		},
	}

	body, err := json.Marshal(userUpdatePasswordPayload{Password: "current-password", NewPassword: "a-long-enough-password"})
	require.NoError(t, err)

	token, _, err := jwtService.GenerateToken(&portainer.TokenData{ID: target.ID, Username: target.Username, Role: target.Role})
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodPut, fmt.Sprintf("/users/%d/passwd", target.ID), bytes.NewBuffer(body))
	testhelpers.AddTestSecurityCookie(req, token)

	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)
	require.Equal(t, http.StatusNoContent, rr.Code)

	stored, err := store.User().Read(target.ID)
	require.NoError(t, err)
	require.Equal(t, portainer.AdministratorRole, stored.Role)
	require.Equal(t, 1, countAdmins(t, store))
}
