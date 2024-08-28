package customtemplates

import (
	"bytes"
	"errors"
	"io"
	"io/fs"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"sync"
	"testing"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/authorization"
	"github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/portainer/portainer/api/jwt"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"

	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/assert"
)

var testFileContent = "abcdefg"

type TestGitService struct {
	portainer.GitService
	targetFilePath string
}

func (g *TestGitService) CloneRepository(destination string, repositoryURL, referenceName string, username, password string, tlsSkipVerify bool) error {
	time.Sleep(100 * time.Millisecond)

	return createTestFile(g.targetFilePath)
}

func (g *TestGitService) LatestCommitID(repositoryURL, referenceName, username, password string, tlsSkipVerify bool) (string, error) {
	return "", nil
}

type TestFileService struct {
	portainer.FileService
}

func (f *TestFileService) GetFileContent(projectPath, configFilePath string) ([]byte, error) {
	return os.ReadFile(filepath.Join(projectPath, configFilePath))
}

type InvalidTestGitService struct {
	portainer.GitService
	targetFilePath string
}

func (g *InvalidTestGitService) CloneRepository(dest, repoUrl, refName, username, password string, tlsSkipVerify bool) error {
	return errors.New("simulate network error")
}

func (g *InvalidTestGitService) LatestCommitID(repositoryURL, referenceName, username, password string, tlsSkipVerify bool) (string, error) {
	return "", nil
}

func createTestFile(targetPath string) error {
	f, err := os.Create(targetPath)
	if err != nil {
		return err
	}
	defer f.Close()

	_, err = f.WriteString(testFileContent)

	return err
}

func prepareTestFolder(projectPath, filename string) error {
	err := os.MkdirAll(projectPath, fs.ModePerm)
	if err != nil {
		return err
	}

	return createTestFile(filepath.Join(projectPath, filename))
}

func singleAPIRequest(h *Handler, jwt string, is *assert.Assertions, expect string) {
	type response struct {
		FileContent string
	}

	req := httptest.NewRequest(http.MethodPut, "/custom_templates/1/git_fetch", bytes.NewBufferString("{}"))
	testhelpers.AddTestSecurityCookie(req, jwt)

	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)

	is.Equal(http.StatusOK, rr.Code)

	body, err := io.ReadAll(rr.Body)
	is.NoError(err, "ReadAll should not return error")

	var resp response
	err = json.Unmarshal(body, &resp)
	is.NoError(err, "response should be list json")
	is.Equal(resp.FileContent, expect)
}

func Test_customTemplateGitFetch(t *testing.T) {
	is := assert.New(t)

	_, store := datastore.MustNewTestStore(t, true, true)

	// create user(s)
	user1 := &portainer.User{ID: 1, Username: "user-1", Role: portainer.StandardUserRole, PortainerAuthorizations: authorization.DefaultPortainerAuthorizations()}
	err := store.User().Create(user1)
	is.NoError(err, "error creating user 1")

	user2 := &portainer.User{ID: 2, Username: "user-2", Role: portainer.StandardUserRole, PortainerAuthorizations: authorization.DefaultPortainerAuthorizations()}
	err = store.User().Create(user2)
	is.NoError(err, "error creating user 2")

	dir, err := os.Getwd()
	is.NoError(err, "error to get working directory")

	template1 := &portainer.CustomTemplate{ID: 1, Title: "custom-template-1", ProjectPath: filepath.Join(dir, "fixtures/custom_template_1"), GitConfig: &gittypes.RepoConfig{ConfigFilePath: "test-config-path.txt"}}
	err = store.CustomTemplateService.Create(template1)
	is.NoError(err, "error creating custom template 1")

	// prepare testing folder
	err = prepareTestFolder(template1.ProjectPath, template1.GitConfig.ConfigFilePath)
	is.NoError(err, "error creating testing folder")

	defer os.RemoveAll(filepath.Join(dir, "fixtures"))

	// setup services
	jwtService, err := jwt.NewService("1h", store)
	is.NoError(err, "Error initiating jwt service")
	requestBouncer := security.NewRequestBouncer(store, jwtService, nil)

	gitService := &TestGitService{
		targetFilePath: filepath.Join(template1.ProjectPath, template1.GitConfig.ConfigFilePath),
	}
	fileService := &TestFileService{}

	h := NewHandler(requestBouncer, store, fileService, gitService)

	// generate two standard users' tokens
	jwt1, _, _ := jwtService.GenerateToken(&portainer.TokenData{ID: user1.ID, Username: user1.Username, Role: user1.Role})
	jwt2, _, _ := jwtService.GenerateToken(&portainer.TokenData{ID: user2.ID, Username: user2.Username, Role: user2.Role})

	t.Run("can return the expected file content by a single call from one user", func(t *testing.T) {
		singleAPIRequest(h, jwt1, is, "abcdefg")
	})

	t.Run("can return the expected file content by multiple calls from one user", func(t *testing.T) {
		var wg sync.WaitGroup
		wg.Add(5)

		for range 5 {
			go func() {
				singleAPIRequest(h, jwt1, is, "abcdefg")
				wg.Done()
			}()
		}

		wg.Wait()
	})

	t.Run("can return the expected file content by multiple calls from different users", func(t *testing.T) {
		var wg sync.WaitGroup
		wg.Add(10)

		for i := range 10 {
			go func(j int) {
				if j%2 == 0 {
					singleAPIRequest(h, jwt1, is, "abcdefg")
				} else {
					singleAPIRequest(h, jwt2, is, "abcdefg")
				}

				wg.Done()
			}(i)
		}

		wg.Wait()
	})

	t.Run("can return the expected file content after a new commit is made", func(t *testing.T) {
		singleAPIRequest(h, jwt1, is, "abcdefg")

		testFileContent = "gfedcba"

		singleAPIRequest(h, jwt2, is, "gfedcba")
	})

	t.Run("restore git repository if it is failed to download the new git repository", func(t *testing.T) {
		invalidGitService := &InvalidTestGitService{
			targetFilePath: filepath.Join(template1.ProjectPath, template1.GitConfig.ConfigFilePath),
		}
		h := NewHandler(requestBouncer, store, fileService, invalidGitService)

		req := httptest.NewRequest(http.MethodPut, "/custom_templates/1/git_fetch", bytes.NewBufferString("{}"))
		testhelpers.AddTestSecurityCookie(req, jwt1)

		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, req)

		is.Equal(http.StatusInternalServerError, rr.Code)

		var errResp httperror.HandlerError
		err = json.NewDecoder(rr.Body).Decode(&errResp)
		assert.NoError(t, err, "failed to parse error body")

		assert.FileExists(t, gitService.targetFilePath, "previous git repository is not restored")
		fileContent, err := os.ReadFile(gitService.targetFilePath)
		assert.NoError(t, err, "failed to read target file")
		assert.Equal(t, "gfedcba", string(fileContent))
	})
}
