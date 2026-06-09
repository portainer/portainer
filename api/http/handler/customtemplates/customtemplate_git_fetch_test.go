package customtemplates

import (
	"bytes"
	"context"
	"errors"
	"io"
	"io/fs"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/filesystem"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/authorization"
	"github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/portainer/portainer/api/jwt"
	"github.com/portainer/portainer/api/logs"
	"github.com/portainer/portainer/pkg/fips"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"

	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"golang.org/x/sync/errgroup"
)

func init() {
	fips.InitFIPS(false)
}

var testFileContent = "abcdefg"

type TestGitService struct {
	portainer.GitService
	targetFilePath string
}

func (g *TestGitService) CloneRepository(
	_ context.Context,
	destination string,
	repositoryURL,
	referenceName string,
	username,
	password string,
	tlsSkipVerify bool,
) error {
	time.Sleep(100 * time.Millisecond)

	return createTestFile(g.targetFilePath)
}

func (g *TestGitService) LatestCommitID(
	_ context.Context,
	repositoryURL,
	referenceName,
	username,
	password string,
	tlsSkipVerify bool,
) (string, error) {
	return "", nil
}

type TestFileService struct {
	portainer.FileService
}

func (f *TestFileService) GetFileContent(projectPath, configFilePath string) ([]byte, error) {
	return os.ReadFile(filesystem.JoinPaths(projectPath, configFilePath))
}

type InvalidTestGitService struct {
	portainer.GitService
	targetFilePath string
}

func (g *InvalidTestGitService) CloneRepository(
	_ context.Context,
	dest,
	repoUrl,
	refName,
	username,
	password string,
	tlsSkipVerify bool,
) error {
	return errors.New("simulate network error")
}

func (g *InvalidTestGitService) LatestCommitID(
	_ context.Context,
	repositoryURL,
	referenceName,
	username,
	password string,
	tlsSkipVerify bool,
) (string, error) {
	return "", nil
}

func createTestFile(targetPath string) error {
	f, err := os.Create(targetPath)
	if err != nil {
		return err
	}
	defer logs.CloseAndLogErr(f)

	_, err = f.WriteString(testFileContent)

	return err
}

func prepareTestFolder(projectPath, filename string) error {
	if err := os.MkdirAll(projectPath, fs.ModePerm); err != nil {
		return err
	}

	return createTestFile(filesystem.JoinPaths(projectPath, filename))
}

func singleAPIRequest(h *Handler, jwt string, expect string) error {
	type response struct {
		FileContent string
	}

	req := httptest.NewRequest(http.MethodPut, "/custom_templates/1/git_fetch", bytes.NewBufferString("{}"))
	testhelpers.AddTestSecurityCookie(req, jwt)

	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		return errors.New("unexpected status code: " + http.StatusText(rr.Code))
	}

	body, err := io.ReadAll(rr.Body)
	if err != nil {
		return err
	}

	var resp response
	if err := json.Unmarshal(body, &resp); err != nil {
		return err
	}

	if resp.FileContent != expect {
		return errors.New("unexpected file content: " + resp.FileContent + ", expected: " + expect)
	}

	return nil
}

func Test_customTemplateGitFetch(t *testing.T) {
	t.Parallel()

	is := assert.New(t)

	_, store := datastore.MustNewTestStore(t, true, true)

	// create user(s)
	user1 := &portainer.User{ID: 1, Username: "user-1", Role: portainer.StandardUserRole, PortainerAuthorizations: authorization.DefaultPortainerAuthorizations()}
	err := store.User().Create(user1)
	require.NoError(t, err, "error creating user 1")

	user2 := &portainer.User{ID: 2, Username: "user-2", Role: portainer.StandardUserRole, PortainerAuthorizations: authorization.DefaultPortainerAuthorizations()}
	err = store.User().Create(user2)
	require.NoError(t, err, "error creating user 2")

	dir, err := os.Getwd()
	require.NoError(t, err, "error to get working directory")

	src := &portainer.Source{
		ID:   1,
		Type: portainer.SourceTypeGit,
		Git: &gittypes.RepoConfig{
			URL: "https://github.com/example/repo",
		},
	}
	err = store.Source().Create(src)
	require.NoError(t, err, "error creating source")

	const configFilePath = "test-config-path.txt"

	template1 := &portainer.CustomTemplate{
		ID:          1,
		Title:       "custom-template-1",
		ProjectPath: filesystem.JoinPaths(dir, "fixtures/custom_template_1"),
		Artifact: &portainer.Artifact{
			Files: []portainer.ArtifactFile{{Path: configFilePath, SourceID: src.ID}},
		},
	}
	err = store.CustomTemplateService.Create(template1)
	require.NoError(t, err, "error creating custom template 1")

	// prepare testing folder
	err = prepareTestFolder(template1.ProjectPath, configFilePath)
	require.NoError(t, err, "error creating testing folder")

	defer func() {
		err := os.RemoveAll(filesystem.JoinPaths(dir, "fixtures"))
		require.NoError(t, err)
	}()

	// setup services
	jwtService, err := jwt.NewService("1h", store)
	require.NoError(t, err, "Error initiating jwt service")

	requestBouncer := security.NewRequestBouncer(t.Context(), store, jwtService, nil)

	gitService := &TestGitService{
		targetFilePath: filesystem.JoinPaths(template1.ProjectPath, configFilePath),
	}
	fileService := &TestFileService{}

	h := NewHandler(requestBouncer, store, fileService, gitService)

	// generate two standard users' tokens
	jwt1, _, err := jwtService.GenerateToken(&portainer.TokenData{ID: user1.ID, Username: user1.Username, Role: user1.Role})
	require.NoError(t, err)

	jwt2, _, err := jwtService.GenerateToken(&portainer.TokenData{ID: user2.ID, Username: user2.Username, Role: user2.Role})
	require.NoError(t, err)

	t.Run("can return the expected file content by a single call from one user", func(t *testing.T) {
		err := singleAPIRequest(h, jwt1, "abcdefg")
		require.NoError(t, err)
	})

	t.Run("can return the expected file content by multiple calls from one user", func(t *testing.T) {
		var g errgroup.Group

		for range 5 {
			g.Go(func() error {
				return singleAPIRequest(h, jwt1, "abcdefg")
			})
		}

		err := g.Wait()
		require.NoError(t, err)
	})

	t.Run("can return the expected file content by multiple calls from different users", func(t *testing.T) {
		var g errgroup.Group

		for i := range 10 {
			g.Go(func() error {
				if i%2 == 0 {
					return singleAPIRequest(h, jwt1, "abcdefg")
				}

				return singleAPIRequest(h, jwt2, "abcdefg")
			})
		}

		err := g.Wait()
		require.NoError(t, err)
	})

	t.Run("can return the expected file content after a new commit is made", func(t *testing.T) {
		err := singleAPIRequest(h, jwt1, "abcdefg")
		require.NoError(t, err)

		testFileContent = "gfedcba"

		err = singleAPIRequest(h, jwt2, "gfedcba")
		require.NoError(t, err)
	})

	t.Run("restore git repository if it is failed to download the new git repository", func(t *testing.T) {
		invalidGitService := &InvalidTestGitService{
			targetFilePath: filesystem.JoinPaths(template1.ProjectPath, configFilePath),
		}
		h := NewHandler(requestBouncer, store, fileService, invalidGitService)

		req := httptest.NewRequest(http.MethodPut, "/custom_templates/1/git_fetch", bytes.NewBufferString("{}"))
		testhelpers.AddTestSecurityCookie(req, jwt1)

		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, req)

		is.Equal(http.StatusInternalServerError, rr.Code)

		var errResp httperror.HandlerError
		err = json.NewDecoder(rr.Body).Decode(&errResp)
		require.NoError(t, err, "failed to parse error body")

		assert.FileExists(t, gitService.targetFilePath, "previous git repository is not restored")
		fileContent, err := os.ReadFile(gitService.targetFilePath)
		require.NoError(t, err, "failed to read target file")
		assert.Equal(t, "gfedcba", string(fileContent))
	})
}

func TestCustomTemplateGitFetch_NilArtifactReturnsBadRequest(t *testing.T) {
	t.Parallel()

	_, store := datastore.MustNewTestStore(t, false, true)

	template := &portainer.CustomTemplate{ID: 1, Title: "no-git-template"}
	err := store.CustomTemplateService.Create(template)
	require.NoError(t, err)

	h := NewHandler(testhelpers.NewTestRequestBouncer(), store, &TestFileService{}, &TestGitService{})

	req := httptest.NewRequest(http.MethodPut, "/custom_templates/1/git_fetch", bytes.NewBufferString("{}"))
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)

	require.Equal(t, http.StatusBadRequest, rr.Code)
}

func TestCustomTemplateGitFetch_EmptySourceIDsReturnsBadRequest(t *testing.T) {
	t.Parallel()

	_, store := datastore.MustNewTestStore(t, false, true)

	template := &portainer.CustomTemplate{
		ID:    1,
		Title: "empty-source-ids",
		Artifact: &portainer.Artifact{
			Files: []portainer.ArtifactFile{},
		},
	}
	err := store.CustomTemplateService.Create(template)
	require.NoError(t, err)

	h := NewHandler(testhelpers.NewTestRequestBouncer(), store, &TestFileService{}, &TestGitService{})

	req := httptest.NewRequest(http.MethodPut, "/custom_templates/1/git_fetch", bytes.NewBufferString("{}"))
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)

	require.Equal(t, http.StatusBadRequest, rr.Code)
}

func TestCustomTemplateGitFetch_SourceWithNilGitConfigReturnsInternalError(t *testing.T) {
	t.Parallel()

	_, store := datastore.MustNewTestStore(t, false, true)

	src := &portainer.Source{Type: portainer.SourceTypeGit}
	err := store.Source().Create(src)
	require.NoError(t, err)

	template := &portainer.CustomTemplate{
		ID:    1,
		Title: "nil-git-config",
		Artifact: &portainer.Artifact{
			Files: []portainer.ArtifactFile{{SourceID: src.ID}},
		},
	}
	err = store.CustomTemplateService.Create(template)
	require.NoError(t, err)

	h := NewHandler(testhelpers.NewTestRequestBouncer(), store, &TestFileService{}, &TestGitService{})

	req := httptest.NewRequest(http.MethodPut, "/custom_templates/1/git_fetch", bytes.NewBufferString("{}"))
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)

	require.Equal(t, http.StatusInternalServerError, rr.Code)
}
