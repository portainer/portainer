package git

import (
	"net/http"

	"github.com/go-git/go-git/v5/plumbing/transport/client"
	"github.com/go-git/go-git/v5/plumbing/transport/git"
	gogithttp "github.com/go-git/go-git/v5/plumbing/transport/http"
	"github.com/go-git/go-git/v5/plumbing/transport/ssh"
)

func InstallSSRFProtocols() {
	gogithttp.DefaultClient = gogithttp.NewClient(&http.Client{Transport: http.DefaultTransport})

	client.InstallProtocol("git", NewSSRFGitTransport(git.DefaultClient))
	client.InstallProtocol("ssh", NewSSRFGitTransport(ssh.DefaultClient))
	client.InstallProtocol("http", NewSSRFGitTransport(gogithttp.DefaultClient))
	client.InstallProtocol("https", NewSSRFGitTransport(gogithttp.DefaultClient))
	client.InstallProtocol("file", nil)
}
