package deployments

import (
	"context"
	"crypto/tls"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"testing"

	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/portainer/portainer/api/internal/testhelpers"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const localhostCert = `-----BEGIN CERTIFICATE-----
MIIEOjCCAiKgAwIBAgIRALg8rJET2/9LjKSxHj0dQhYwDQYJKoZIhvcNAQELBQAw
FzEVMBMGA1UEAxMMUG9ydGFpbmVyIENBMB4XDTIzMTAxMTE5NDcxMVoXDTI1MDQx
MTE5NTM0MVowFDESMBAGA1UEAxMJbG9jYWxob3N0MIIBIjANBgkqhkiG9w0BAQEF
AAOCAQ8AMIIBCgKCAQEAx4nNGiwcCqUCxZyVLIHqvjTy20ZtZDVCedssTv1W5tmz
YqOIYGaW3CqzlRn6vBHu9bMHXef4+XfS0igKBn76MAKn5IcTccIWIal+5jq48pI3
c2FzQ3qNujX2zqZPjAjhJnVeVCP3kJu4wUtuubswLPBVLdktGa6EkL+8nu6o0Phw
6scV6s3gUmQk5/lpH4FIff8M7NAdTOxiFImQ1M0vplKtaEeiCnskpgyI8CbZl7X0
38Pu178W3+LqB7N4iMy2gKnBwjsXzw/+1dfUGkKjYdDBD+kNEKrQ4dwkjkrkQVdt
Z+GN26NvXHoeeyX/MLnVgdLbiIjvsf0DDIhabKqTcwIDAQABo4GDMIGAMA4GA1Ud
DwEB/wQEAwIDuDAdBgNVHSUEFjAUBggrBgEFBQcDAQYIKwYBBQUHAwIwHQYDVR0O
BBYEFPCefmK5Szzlfs8FRCa5+kRCIEWuMB8GA1UdIwQYMBaAFKZZ074SR/ajD3zE
gxpLGRvFT3XAMA8GA1UdEQQIMAaHBH8AAAEwDQYJKoZIhvcNAQELBQADggIBABcQ
/WPSUpuQvrcVBsmIlOMz74cDZYuIDls/mAcB/yP3mm+oWlO0qvH/F/BMs1P/bkgj
fByQZq8Zmi6/TEZNlGvW7KGx077VxDKi8jd1jL3gLDPmkFjYuGeIWQusgxBu1y3m
0WoTTqnkoism1mzV/dgNwrm3YQIV4H/fi9EEdQSm0UFRTKSAGBkwS7N2pmNb5yQO
U8glFpyznCv4evDJbs/JUUXKYExgFFhWUd25P7iBRLXg/BFfqdSTiUGUj/Msz0pO
Evqmq78eIiXjyyKSxzve6/mEIeq6AE3AC9zH+fwTd6Mhp+T2P/S/iO4EU19IMR4m
sbNBd6h/3GvRekO1KbqQ42awuMnxvWT0NVclSxiU1lMpAmRmk/w9z7wB3r4n7oh4
iiOTl5VSw1UBkcLDOJw+HB/FU2PdVFfIJKRfjLCZOGrcJX9vEcz7dYGpB5HrdqOc
/8q5j1g6f/pGE+20HITrtz6ChguETzqw5dLNeKeolC6bVH8yEtmpnP2n8VPnT9Di
V+hnONcJ+wd/dkBqabGr7LPG24Kj1F2Zp3CDDvJA94FaEsgaLfSg3JD+43uRCOWM
RuqU8bGuhQRqilR2dSIOrFaW2+MeUHsb24cUn/pkHqKpSg+RBEnf6QfGDlIgqYEl
19f/HFVBc/a8lM/D81lMyDbjQ9zH4LDYj4ipBbkL
-----END CERTIFICATE-----`

const localhostKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEAx4nNGiwcCqUCxZyVLIHqvjTy20ZtZDVCedssTv1W5tmzYqOI
YGaW3CqzlRn6vBHu9bMHXef4+XfS0igKBn76MAKn5IcTccIWIal+5jq48pI3c2Fz
Q3qNujX2zqZPjAjhJnVeVCP3kJu4wUtuubswLPBVLdktGa6EkL+8nu6o0Phw6scV
6s3gUmQk5/lpH4FIff8M7NAdTOxiFImQ1M0vplKtaEeiCnskpgyI8CbZl7X038Pu
178W3+LqB7N4iMy2gKnBwjsXzw/+1dfUGkKjYdDBD+kNEKrQ4dwkjkrkQVdtZ+GN
26NvXHoeeyX/MLnVgdLbiIjvsf0DDIhabKqTcwIDAQABAoIBAQCqSP6BPG195A52
iEeCISksw9ERsou+fflKNvIcQvV7swP0xOyooERUhhiVwQMKpx9QDUXXLRV8CHch
JExR+OEYQdv4GhJM/b6XYafLYQfe80thKyQLzTXQWSdUeffe4OEMShODKOKoRUyp
oO9Qj9/wKfX3V6S2iwnU4dxdofztv+YP9rYQyjnhKbv/9OfeCp2Pb9eFKKRsA+QQ
xneDz1+wr8ToTuiTn8HBPNSeSAKvhzXuzyluI7VAetRloNgCtumrA9kpVbW2cDgE
Gk0q3RY125ejFELQO/cOJFuBsqoJlvPxzg8/vHyfyF9hFMqbqvcUw2e1eqHpnJd5
dP4+ZGYZAoGBAOOFuPXMLBts0rN9mfNbVfx36H+aOCL77SafZvWm0D+rH69QN3/q
/ZSWQEjwH5Tzn1e+NVcl/Um2vL/dIyEGBklXQ7yAyJo25gpEOD/rt1U94HKzMOwy
yKtsKghRAOx0piie7ORS6MGbEOQxU3/1Eg1uvd0qoSnALqJ/le75QpFXAoGBAOCD
aZQTszzDddr1cFPzLyqjIGJWfPcDYSONXVcCeQmhvC7mkfw9SWdIfku7JbdNgFYq
ZAAU0klsLX0lEe8f4A12FnHNylKoxmTWdE3wWPptejdA1KUgzt/2kNljgOMFuY0Q
rlCEW/Jabrg5aFMwVVG8bHLZR0xalfniDvXLvnFFAoGACdztJLKiIto31BIYz2Th
OF2WVZnA3ztej3MPioydsHThnb7zePcd4QgWZ1MJe3KIMMyNEWcTMNPcINEcSb0y
HpHK3OwURiMlG8LTUWoNe4OALFi6QTL+YfgBZnTkflucLFyfVlKFxobLV6kPvpdI
Hg7z6heD/wRWwTKYtFBX42cCgYBIeoQJ9rYlRqB0eEm0AEzYweLBfFRJVgD0/j0E
ytqSPnFG3s6AFLTur9t9zUPmwhFNP9Aaqp4cb9zbiq0YejzVe6rRQHMxbiTmBslz
I8VFyzPqRHahfE7sxGeMlm/UWlPFc34ipigcvA8EUBwaxv60LVUBWp2Gy7OhANZ9
iTHI1QKBgQCdHFj9dnbpaEHA426CoaPsyj5cv2nBLRf8p1cs71sq+qQOGlGJfajm
L9x22ol5c5rToZa1qKSnSdSDCud298MyRujMUy2UcUKHeNs3MK9AT41sDv266I7b
vJUUCFYm8+9p6gTVOcoMit+eGSwa81PCPEs1TnU1PV/PaDFeUhn/mg==
-----END RSA PRIVATE KEY-----`

type noopDeployer struct{}

// without unpacker
func (s *noopDeployer) DeploySwarmStack(stack *portainer.Stack, endpoint *portainer.Endpoint, registries []portainer.Registry, prune bool, pullImage bool) error {
	return nil
}

func (s *noopDeployer) DeployComposeStack(stack *portainer.Stack, endpoint *portainer.Endpoint, registries []portainer.Registry, forcePullImage bool, forceRecreate bool) error {
	return nil
}

func (s *noopDeployer) DeployKubernetesStack(stack *portainer.Stack, endpoint *portainer.Endpoint, user *portainer.User) error {
	return nil
}

// with unpacker
func (s *noopDeployer) DeployRemoteComposeStack(stack *portainer.Stack, endpoint *portainer.Endpoint, registries []portainer.Registry, forcePullImage bool, forceRecreate bool) error {
	return nil
}
func (s *noopDeployer) UndeployRemoteComposeStack(stack *portainer.Stack, endpoint *portainer.Endpoint) error {
	return nil
}
func (s *noopDeployer) StartRemoteComposeStack(stack *portainer.Stack, endpoint *portainer.Endpoint) error {
	return nil
}
func (s *noopDeployer) StopRemoteComposeStack(stack *portainer.Stack, endpoint *portainer.Endpoint) error {
	return nil
}
func (s *noopDeployer) DeployRemoteSwarmStack(stack *portainer.Stack, endpoint *portainer.Endpoint, registries []portainer.Registry, prune bool, pullImage bool) error {
	return nil
}
func (s *noopDeployer) UndeployRemoteSwarmStack(stack *portainer.Stack, endpoint *portainer.Endpoint) error {
	return nil
}
func (s *noopDeployer) StartRemoteSwarmStack(stack *portainer.Stack, endpoint *portainer.Endpoint) error {
	return nil
}
func (s *noopDeployer) StopRemoteSwarmStack(stack *portainer.Stack, endpoint *portainer.Endpoint) error {
	return nil
}

func agentServer(t *testing.T) string {
	h := http.NewServeMux()

	h.HandleFunc("/ping", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set(portainer.PortainerAgentHeader, "v2.19.0")
		w.Header().Set(portainer.HTTPResponseAgentPlatform, strconv.Itoa(int(portainer.AgentPlatformDocker)))

		response.Empty(w)
	})

	cert, err := tls.X509KeyPair([]byte(localhostCert), []byte(localhostKey))
	require.NoError(t, err)

	tlsConfig := &tls.Config{
		Certificates: []tls.Certificate{cert},
	}

	l, err := tls.Listen("tcp", "127.0.0.1:0", tlsConfig)
	require.NoError(t, err)

	s := &http.Server{
		Handler: h,
	}

	go func() {
		err := s.Serve(l)
		require.ErrorIs(t, err, http.ErrServerClosed)
	}()

	t.Cleanup(func() {
		s.Shutdown(context.Background())
	})

	return "http://" + l.Addr().String()
}

func Test_redeployWhenChanged_FailsWhenCannotFindStack(t *testing.T) {
	_, store := datastore.MustNewTestStore(t, true, true)

	err := RedeployWhenChanged(1, nil, store, nil)
	assert.Error(t, err)
	assert.Truef(t, strings.HasPrefix(err.Error(), "failed to get the stack"), "it isn't an error we expected: %v", err.Error())
}

func Test_redeployWhenChanged_DoesNothingWhenNotAGitBasedStack(t *testing.T) {
	_, store := datastore.MustNewTestStore(t, true, true)

	admin := &portainer.User{ID: 1, Username: "admin"}
	err := store.User().Create(admin)
	assert.NoError(t, err, "error creating an admin")

	err = store.Stack().Create(&portainer.Stack{ID: 1, CreatedBy: "admin"})
	assert.NoError(t, err, "failed to create a test stack")

	err = RedeployWhenChanged(1, nil, store, testhelpers.NewGitService(nil, ""))
	assert.NoError(t, err)
}

func Test_redeployWhenChanged_DoesNothingWhenNoGitChanges(t *testing.T) {
	_, store := datastore.MustNewTestStore(t, true, true)

	tmpDir := t.TempDir()

	admin := &portainer.User{ID: 1, Username: "admin"}
	err := store.User().Create(admin)
	assert.NoError(t, err, "error creating an admin")

	err = store.Endpoint().Create(&portainer.Endpoint{
		ID: 0,
	})
	assert.NoError(t, err, "error creating environment")

	err = store.Stack().Create(&portainer.Stack{
		ID:          1,
		CreatedBy:   "admin",
		ProjectPath: tmpDir,
		GitConfig: &gittypes.RepoConfig{
			URL:           "url",
			ReferenceName: "ref",
			ConfigHash:    "oldHash",
		}})
	assert.NoError(t, err, "failed to create a test stack")

	err = RedeployWhenChanged(1, nil, store, testhelpers.NewGitService(nil, "oldHash"))
	assert.NoError(t, err)
}

func Test_redeployWhenChanged_FailsWhenCannotClone(t *testing.T) {
	cloneErr := errors.New("failed to clone")
	_, store := datastore.MustNewTestStore(t, true, true)

	admin := &portainer.User{ID: 1, Username: "admin"}
	err := store.User().Create(admin)
	assert.NoError(t, err, "error creating an admin")

	err = store.Endpoint().Create(&portainer.Endpoint{
		ID:  0,
		URL: agentServer(t),
		TLSConfig: portainer.TLSConfiguration{
			TLS:           true,
			TLSSkipVerify: true,
		},
	})
	assert.NoError(t, err, "error creating environment")

	err = store.Stack().Create(&portainer.Stack{
		ID:        1,
		CreatedBy: "admin",
		GitConfig: &gittypes.RepoConfig{
			URL:           "url",
			ReferenceName: "ref",
			ConfigHash:    "oldHash",
		}})
	assert.NoError(t, err, "failed to create a test stack")

	err = RedeployWhenChanged(1, nil, store, testhelpers.NewGitService(cloneErr, "newHash"))
	assert.Error(t, err)
	assert.ErrorIs(t, err, cloneErr, "should failed to clone but didn't, check test setup")
}

func Test_redeployWhenChanged(t *testing.T) {
	_, store := datastore.MustNewTestStore(t, true, true)

	tmpDir := t.TempDir()

	err := store.Endpoint().Create(&portainer.Endpoint{ID: 1})
	assert.NoError(t, err, "error creating environment")

	username := "user"
	err = store.User().Create(&portainer.User{Username: username, Role: portainer.AdministratorRole})
	assert.NoError(t, err, "error creating a user")

	stack := portainer.Stack{
		ID:          1,
		EndpointID:  1,
		ProjectPath: tmpDir,
		UpdatedBy:   username,
		GitConfig: &gittypes.RepoConfig{
			URL:           "url",
			ReferenceName: "ref",
			ConfigHash:    "oldHash",
		},
	}

	err = store.Stack().Create(&stack)
	assert.NoError(t, err, "failed to create a test stack")

	t.Run("can deploy docker compose stack", func(t *testing.T) {
		stack.Type = portainer.DockerComposeStack
		store.Stack().Update(stack.ID, &stack)

		err = RedeployWhenChanged(1, &noopDeployer{}, store, testhelpers.NewGitService(nil, "newHash"))
		assert.NoError(t, err)
	})

	t.Run("can deploy docker swarm stack", func(t *testing.T) {
		stack.Type = portainer.DockerSwarmStack
		store.Stack().Update(stack.ID, &stack)

		err = RedeployWhenChanged(1, &noopDeployer{}, store, testhelpers.NewGitService(nil, "newHash"))
		assert.NoError(t, err)
	})

	t.Run("can deploy kube app", func(t *testing.T) {
		stack.Type = portainer.KubernetesStack
		store.Stack().Update(stack.ID, &stack)

		err = RedeployWhenChanged(1, &noopDeployer{}, store, testhelpers.NewGitService(nil, "newHash"))
		assert.NoError(t, err)
	})
}

func Test_getUserRegistries(t *testing.T) {
	_, store := datastore.MustNewTestStore(t, true, true)

	endpointID := 123

	admin := &portainer.User{ID: 1, Username: "admin", Role: portainer.AdministratorRole}
	err := store.User().Create(admin)
	assert.NoError(t, err, "error creating an admin")

	user := &portainer.User{ID: 2, Username: "user", Role: portainer.StandardUserRole}
	err = store.User().Create(user)
	assert.NoError(t, err, "error creating a user")

	team := portainer.Team{ID: 1, Name: "team"}

	store.TeamMembership().Create(&portainer.TeamMembership{
		ID:     1,
		UserID: user.ID,
		TeamID: team.ID,
		Role:   portainer.TeamMember,
	})

	registryReachableByUser := portainer.Registry{
		ID:   1,
		Name: "registryReachableByUser",
		RegistryAccesses: portainer.RegistryAccesses{
			portainer.EndpointID(endpointID): {
				UserAccessPolicies: map[portainer.UserID]portainer.AccessPolicy{
					user.ID: {RoleID: portainer.RoleID(portainer.StandardUserRole)},
				},
			},
		},
	}
	err = store.Registry().Create(&registryReachableByUser)
	assert.NoError(t, err, "couldn't create a registry")

	registryReachableByTeam := portainer.Registry{
		ID:   2,
		Name: "registryReachableByTeam",
		RegistryAccesses: portainer.RegistryAccesses{
			portainer.EndpointID(endpointID): {
				TeamAccessPolicies: map[portainer.TeamID]portainer.AccessPolicy{
					team.ID: {RoleID: portainer.RoleID(portainer.StandardUserRole)},
				},
			},
		},
	}
	err = store.Registry().Create(&registryReachableByTeam)
	assert.NoError(t, err, "couldn't create a registry")

	registryRestricted := portainer.Registry{
		ID:   3,
		Name: "registryRestricted",
		RegistryAccesses: portainer.RegistryAccesses{
			portainer.EndpointID(endpointID): {
				UserAccessPolicies: map[portainer.UserID]portainer.AccessPolicy{
					user.ID + 100: {RoleID: portainer.RoleID(portainer.StandardUserRole)},
				},
			},
		},
	}
	err = store.Registry().Create(&registryRestricted)
	assert.NoError(t, err, "couldn't create a registry")

	t.Run("admin should has access to all registries", func(t *testing.T) {
		registries, err := getUserRegistries(store, admin, portainer.EndpointID(endpointID))
		assert.NoError(t, err)
		assert.ElementsMatch(t, []portainer.Registry{registryReachableByUser, registryReachableByTeam, registryRestricted}, registries)
	})

	t.Run("regular user has access to registries allowed to him and/or his team", func(t *testing.T) {
		registries, err := getUserRegistries(store, user, portainer.EndpointID(endpointID))
		assert.NoError(t, err)
		assert.ElementsMatch(t, []portainer.Registry{registryReachableByUser, registryReachableByTeam}, registries)
	})
}
