package update

import (
	"context"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/portainer/portainer/api/filesystem"
	gittypes "github.com/portainer/portainer/api/git/types"

	"github.com/rs/zerolog/log"
)

const (
	tmpCloneDirPrefix = ".gitops-clone-"
	staleTmpCloneAge  = 24 * time.Hour
)

type RepoRequest struct {
	URL            string
	ReferenceName  string
	Authentication *gittypes.GitAuthentication
	TLSSkipVerify  bool
}

type tmpClonesKey struct {
	url, ref           string
	tlsSkipVerify      bool
	username, password string
	provider           gittypes.GitProvider
	authType           gittypes.GitCredentialAuthType
	hash               string
}

type outcome struct {
	val string
	err error
}

type TmpClones struct {
	mu      sync.Mutex
	closed  bool
	commits map[tmpClonesKey]outcome
	clones  map[tmpClonesKey]outcome
}

type tmpClonesCtxKey struct{}

// WithTmpClones returns a context carrying new TmpClones. The caller must Close them
func WithTmpClones(ctx context.Context) (context.Context, *TmpClones) {
	t := &TmpClones{
		commits: make(map[tmpClonesKey]outcome),
		clones:  make(map[tmpClonesKey]outcome),
	}

	return context.WithValue(ctx, tmpClonesCtxKey{}, t), t
}

// TmpClonesFromContext returns the TmpClones carried by ctx, or nil. A nil TmpClones is valid and
// makes every call go straight to the network
func TmpClonesFromContext(ctx context.Context) *TmpClones {
	t, _ := ctx.Value(tmpClonesCtxKey{}).(*TmpClones)

	return t
}

// CommitID returns the result of fetch, running it at most once per distinct request
func (t *TmpClones) CommitID(req RepoRequest, fetch func() (string, error)) (string, error) {
	if t == nil {
		return fetch()
	}

	key := newTmpClonesKey(req, "")

	t.mu.Lock()
	if t.closed {
		t.mu.Unlock()

		return fetch()
	}
	defer t.mu.Unlock()

	if o, ok := t.commits[key]; ok {
		return o.val, o.err
	}

	hash, err := fetch()
	t.commits[key] = outcome{hash, err}

	return hash, err
}

// Clone puts a checkout of the request at the given commit in toDir, running clone at most once
// per distinct request and commit. The shared checkout lives in a temporary directory inside
// tmpParent and every caller gets its own copy of the files
func (t *TmpClones) Clone(req RepoRequest, hash, tmpParent, toDir string, clone func(dst string) error) error {
	if t == nil {
		return clone(toDir)
	}

	key := newTmpClonesKey(req, hash)

	t.mu.Lock()
	if t.closed {
		t.mu.Unlock()

		return clone(toDir)
	}
	defer t.mu.Unlock()

	o, ok := t.clones[key]
	if !ok {
		dir, err := cloneToTmp(tmpParent, clone)
		o = outcome{dir, err}
		t.clones[key] = o
	}

	if o.err != nil {
		return o.err
	}

	return filesystem.CopyDir(o.val, toDir, false)
}

// Close removes the temporary clones. Calls made after it, for example by a deployment that
// outlives the poll, go straight to the network
func (t *TmpClones) Close() {
	if t == nil {
		return
	}

	t.mu.Lock()
	defer t.mu.Unlock()

	t.closed = true

	for _, o := range t.clones {
		if o.val == "" {
			continue
		}

		if err := os.RemoveAll(o.val); err != nil {
			log.Warn().Err(err).Str("dir", o.val).Msg("failed to remove temporary git clone")
		}
	}
}

func cloneToTmp(tmpParent string, clone func(dst string) error) (string, error) {
	if err := os.MkdirAll(tmpParent, 0o755); err != nil {
		return "", err
	}

	removeStaleTmpClones(tmpParent)

	dir, err := os.MkdirTemp(tmpParent, tmpCloneDirPrefix)
	if err != nil {
		return "", err
	}

	if err := clone(dir); err != nil {
		if removeErr := os.RemoveAll(dir); removeErr != nil {
			log.Warn().Err(removeErr).Str("dir", dir).Msg("failed to remove partial temporary git clone")
		}

		return "", err
	}

	return dir, nil
}

func removeStaleTmpClones(parent string) {
	entries, err := os.ReadDir(parent)
	if err != nil {
		log.Warn().Err(err).Str("dir", parent).Msg("failed to look for stale temporary git clones")

		return
	}

	for _, e := range entries {
		if !e.IsDir() || !strings.HasPrefix(e.Name(), tmpCloneDirPrefix) {
			continue
		}

		info, err := e.Info()
		if err != nil || time.Since(info.ModTime()) < staleTmpCloneAge {
			continue
		}

		dir := filesystem.JoinPaths(parent, e.Name())
		if err := os.RemoveAll(dir); err != nil {
			log.Warn().Err(err).Str("dir", dir).Msg("failed to remove stale temporary git clone")
		}
	}
}

func newTmpClonesKey(req RepoRequest, hash string) tmpClonesKey {
	key := tmpClonesKey{url: req.URL, ref: req.ReferenceName, tlsSkipVerify: req.TLSSkipVerify, hash: hash}

	if a := req.Authentication; a != nil {
		key.username, key.password, key.provider, key.authType = a.Username, a.Password, a.Provider, a.AuthorizationType
	}

	return key
}
