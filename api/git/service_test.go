package git

import (
	"context"
	"errors"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing"
)

type mockRepoManager struct {
	downloadErr error
	commitID    string
	commitIDErr error
	refs        []string
	refsErr     error
	files       []string
	filesErr    error

	downloadCalled   int
	commitIDCalled   int
	listRefsCalled   int
	listFilesCalled  int
	lastCloneOptions *git.CloneOptions
}

func (m *mockRepoManager) Download(_ context.Context, _ string, opts *git.CloneOptions) error {
	m.downloadCalled++
	m.lastCloneOptions = opts
	return m.downloadErr
}

func (m *mockRepoManager) LatestCommitID(_ context.Context, _, _ string, _ *git.ListOptions) (string, error) {
	m.commitIDCalled++
	return m.commitID, m.commitIDErr
}

func (m *mockRepoManager) ListRefs(_ context.Context, _ string, _ *git.ListOptions) ([]string, error) {
	m.listRefsCalled++
	return m.refs, m.refsErr
}

func (m *mockRepoManager) ListFiles(_ context.Context, _ bool, _ *git.CloneOptions) ([]string, error) {
	m.listFilesCalled++
	return m.files, m.filesErr
}

func newTestService(ctx context.Context, cacheSize int, gitMgr, azureMgr RepoManager) *Service {
	s := newService(ctx, cacheSize, 0)
	s.git = gitMgr
	s.azure = azureMgr
	return s
}

func TestCloneRepository(t *testing.T) {
	t.Parallel()
	downloadErr := errors.New("clone failed")

	testCases := []struct {
		name                       string
		url                        string
		referenceName              string
		gitManagerDownloadCalled   int
		azureManagerDownloadCalled int
		managerErr                 bool
		expectedError              error
		expectedReferenceName      string
	}{
		{
			name:                       "non-azure URL routes to git manager",
			url:                        "https://github.com/example/repo.git",
			gitManagerDownloadCalled:   1,
			azureManagerDownloadCalled: 0,
		},
		{
			name:                       "azure URL routes to azure manager",
			url:                        "https://dev.azure.com/org/project/_git/repo",
			gitManagerDownloadCalled:   0,
			azureManagerDownloadCalled: 1,
		},
		{
			name:                     "error from manager propagated",
			url:                      "https://github.com/example/repo.git",
			managerErr:               true,
			gitManagerDownloadCalled: 1,
			expectedError:            downloadErr,
		},
		{
			name:                     "ReferenceName is passed to clone options",
			url:                      "https://github.com/example/repo.git",
			referenceName:            "refs/heads/feature-branch",
			gitManagerDownloadCalled: 1,
			expectedReferenceName:    "refs/heads/feature-branch",
		},
		{
			name:                     "empty ReferenceName leaves clone options unset",
			url:                      "https://github.com/example/repo.git",
			referenceName:            "",
			gitManagerDownloadCalled: 1,
			expectedReferenceName:    "",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			gitMgr := &mockRepoManager{}
			azureMgr := &mockRepoManager{}
			if tc.managerErr {
				gitMgr.downloadErr = downloadErr
				azureMgr.downloadErr = downloadErr
			}
			s := newTestService(t.Context(), 4, gitMgr, azureMgr)

			err := s.CloneRepository(t.Context(), "/tmp", tc.url, tc.referenceName, "", "", false)
			require.Equal(t, tc.expectedError, err)
			require.Equal(t, tc.gitManagerDownloadCalled, gitMgr.downloadCalled)
			require.Equal(t, tc.azureManagerDownloadCalled, azureMgr.downloadCalled)

			activeMgr := gitMgr
			if tc.azureManagerDownloadCalled > 0 {
				activeMgr = azureMgr
			}
			if activeMgr.lastCloneOptions != nil {
				require.Equal(t, plumbing.ReferenceName(tc.expectedReferenceName), activeMgr.lastCloneOptions.ReferenceName)
			}
		})
	}
}

func TestLatestCommitID(t *testing.T) {
	t.Parallel()
	commitLookupErr := errors.New("commit lookup failed")

	testCases := []struct {
		name          string
		url           string
		gitCommitID   string
		azureCommitID string
		commitIDErr   error
		expectedID    string
		expectedError error
		gitCalled     int
		azureCalled   int
	}{
		{
			name:        "non-azure URL routes to git manager",
			url:         "https://github.com/example/repo.git",
			gitCommitID: "abc123",
			expectedID:  "abc123",
			gitCalled:   1,
		},
		{
			name:          "azure URL routes to azure manager",
			url:           "https://dev.azure.com/org/project/_git/repo",
			azureCommitID: "def456",
			expectedID:    "def456",
			azureCalled:   1,
		},
		{
			name:          "error propagated",
			url:           "https://github.com/example/repo.git",
			commitIDErr:   commitLookupErr,
			expectedError: commitLookupErr,
			gitCalled:     1,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			gitMgr := &mockRepoManager{commitID: tc.gitCommitID, commitIDErr: tc.commitIDErr}
			azureMgr := &mockRepoManager{commitID: tc.azureCommitID}
			s := newTestService(t.Context(), 4, gitMgr, azureMgr)

			id, err := s.LatestCommitID(t.Context(), tc.url, "", "", "", false)
			require.Equal(t, tc.expectedError, err)
			require.Equal(t, tc.expectedID, id)
			require.Equal(t, tc.gitCalled, gitMgr.commitIDCalled)
			require.Equal(t, tc.azureCalled, azureMgr.commitIDCalled)
		})
	}
}

func TestListRefs(t *testing.T) {
	t.Parallel()
	t.Run("cache hit on second call", func(t *testing.T) {
		gitMgr := &mockRepoManager{refs: []string{"refs/heads/main", "refs/heads/develop"}}
		s := newTestService(t.Context(), 4, gitMgr, &mockRepoManager{})

		refs1, err := s.ListRefs(t.Context(), "https://github.com/example/repo.git", "", "", false, false)
		require.NoError(t, err)

		refs2, err := s.ListRefs(t.Context(), "https://github.com/example/repo.git", "", "", false, false)
		require.NoError(t, err)

		require.Equal(t, 1, gitMgr.listRefsCalled, "expected manager to be called once")
		require.Equal(t, refs1, refs2)
	})

	t.Run("hard refresh clears cache and calls manager again", func(t *testing.T) {
		gitMgr := &mockRepoManager{refs: []string{"refs/heads/main"}}
		s := newTestService(t.Context(), 4, gitMgr, &mockRepoManager{})

		_, err := s.ListRefs(t.Context(), "https://github.com/example/repo.git", "", "", false, false)
		require.NoError(t, err)
		_, err = s.ListRefs(t.Context(), "https://github.com/example/repo.git", "", "", true, false)
		require.NoError(t, err)

		require.Equal(t, 2, gitMgr.listRefsCalled, "expected manager to be called twice with hard refresh")
	})

	t.Run("error propagated and not cached", func(t *testing.T) {
		wantErr := errors.New("refs failed")
		gitMgr := &mockRepoManager{refsErr: wantErr}
		s := newTestService(t.Context(), 4, gitMgr, &mockRepoManager{})

		_, err := s.ListRefs(t.Context(), "https://github.com/example/repo.git", "", "", false, false)
		require.Equal(t, wantErr, err)

		_, err = s.ListRefs(t.Context(), "https://github.com/example/repo.git", "", "", true, false)
		require.Equal(t, wantErr, err)
		require.Equal(t, 2, gitMgr.listRefsCalled, "expected manager to be called twice after error")
	})

	t.Run("azure URL routes to azure manager", func(t *testing.T) {
		gitMgr := &mockRepoManager{}
		azureMgr := &mockRepoManager{refs: []string{"refs/heads/main"}}
		s := newTestService(t.Context(), 4, gitMgr, azureMgr)

		_, err := s.ListRefs(t.Context(), "https://dev.azure.com/org/project/_git/repo", "", "", false, false)
		require.NoError(t, err)
		require.Equal(t, 1, azureMgr.listRefsCalled, "expected azure.ListRefs to be called once")
		require.Equal(t, 0, gitMgr.listRefsCalled, "expected git.ListRefs to not be called")
	})

	t.Run("cache disabled: manager always called", func(t *testing.T) {
		gitMgr := &mockRepoManager{refs: []string{"refs/heads/main"}}
		s := newTestService(t.Context(), 0, gitMgr, &mockRepoManager{})

		_, err := s.ListRefs(t.Context(), "https://github.com/example/repo.git", "", "", false, false)
		require.NoError(t, err)
		_, err = s.ListRefs(t.Context(), "https://github.com/example/repo.git", "", "", false, false)
		require.NoError(t, err)

		require.Equal(t, 2, gitMgr.listRefsCalled, "expected manager to be called twice with cache disabled")
	})
}

func TestListFiles(t *testing.T) {
	t.Parallel()
	t.Run("cache hit on second call", func(t *testing.T) {
		gitMgr := &mockRepoManager{files: []string{"docker-compose.yml", "README.md"}}
		s := newTestService(t.Context(), 4, gitMgr, &mockRepoManager{})

		files1, err := s.ListFiles(t.Context(), "https://github.com/example/repo.git", "refs/heads/main", "", "", false, false, nil, false)
		require.NoError(t, err)

		files2, err := s.ListFiles(t.Context(), "https://github.com/example/repo.git", "refs/heads/main", "", "", false, false, nil, false)
		require.NoError(t, err)

		require.Equal(t, 1, gitMgr.listFilesCalled, "expected manager to be called once")
		require.Equal(t, files1, files2)
	})

	t.Run("hard refresh clears file cache", func(t *testing.T) {
		gitMgr := &mockRepoManager{files: []string{"docker-compose.yml"}}
		s := newTestService(t.Context(), 4, gitMgr, &mockRepoManager{})

		_, err := s.ListFiles(t.Context(), "https://github.com/example/repo.git", "refs/heads/main", "", "", false, false, nil, false)
		require.NoError(t, err)
		_, err = s.ListFiles(t.Context(), "https://github.com/example/repo.git", "refs/heads/main", "", "", false, true, nil, false)
		require.NoError(t, err)

		require.Equal(t, 2, gitMgr.listFilesCalled, "expected manager to be called twice with hard refresh")
	})

	t.Run("azure URL routes to azure manager", func(t *testing.T) {
		gitMgr := &mockRepoManager{}
		azureMgr := &mockRepoManager{files: []string{"docker-compose.yml"}}
		s := newTestService(t.Context(), 4, gitMgr, azureMgr)

		_, err := s.ListFiles(t.Context(), "https://dev.azure.com/org/project/_git/repo", "", "", "", false, false, nil, false)
		require.NoError(t, err)
		require.Equal(t, 1, azureMgr.listFilesCalled, "expected azure.ListFiles to be called once")
		require.Equal(t, 0, gitMgr.listFilesCalled, "expected git.ListFiles to not be called")
	})

	t.Run("extension filter applied", func(t *testing.T) {
		gitMgr := &mockRepoManager{files: []string{"docker-compose.yml", "README.md", "stack.yml", "config.json"}}
		s := newTestService(t.Context(), 4, gitMgr, &mockRepoManager{})

		files, err := s.ListFiles(t.Context(), "https://github.com/example/repo.git", "", "", "", false, false, []string{".yml"}, false)
		require.NoError(t, err)
		require.Equal(t, []string{"docker-compose.yml", "stack.yml"}, files)
	})

	t.Run("error is returned and not cached", func(t *testing.T) {
		wantErr := errors.New("list files failed")
		gitMgr := &mockRepoManager{filesErr: wantErr}
		s := newTestService(t.Context(), 4, gitMgr, &mockRepoManager{})

		files, err := s.ListFiles(t.Context(), "https://github.com/example/repo.git", "refs/heads/main", "", "", false, false, nil, false)
		require.ErrorIs(t, err, wantErr)
		require.Nil(t, files)
	})
}

func TestFilterFiles(t *testing.T) {
	t.Parallel()
	testCases := []struct {
		name          string
		files         []string
		exts          []string
		expectedFiles []string
	}{
		{
			name:          "empty ext list returns all files",
			files:         []string{"a.yml", "b.json", "c.txt"},
			exts:          nil,
			expectedFiles: []string{"a.yml", "b.json", "c.txt"},
		},
		{
			name:          "non-matching exts returns empty",
			files:         []string{"a.yml", "b.json"},
			exts:          []string{".txt"},
			expectedFiles: nil,
		},
		{
			name:          "partial match returns only matching files",
			files:         []string{"a.yml", "b.json", "c.yml"},
			exts:          []string{".yml"},
			expectedFiles: []string{"a.yml", "c.yml"},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			require.Equal(t, tc.expectedFiles, filterFiles(tc.files, tc.exts))
		})
	}
}
