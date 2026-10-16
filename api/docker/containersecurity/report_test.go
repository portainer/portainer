package containersecurity

import "testing"

func TestEvaluate(t *testing.T) {
	tests := []struct {
		name                    string
		in                      Input
		score, pass, warn, fail int
	}{
		{
			name:  "fully hardened container",
			in:    Input{Image: "nginx:1.27", User: "1000", MemoryLimit: 256 << 20, ReadonlyRootfs: true},
			score: 100, pass: 7, warn: 0, fail: 0,
		},
		{
			name:  "container with defaults",
			in:    Input{Image: "alpine:latest"},
			score: 71, pass: 3, warn: 3, fail: 1,
		},
		{
			name: "portainer-like container",
			in: Input{
				Image:        "portainer/portainer-ce:latest",
				Binds:        []string{"/var/run/docker.sock:/var/run/docker.sock"},
				PortBindings: []PortBinding{{HostIP: "0.0.0.0", HostPort: "9444"}, {HostIP: "", HostPort: "9001"}},
			},
			score: 55, pass: 1, warn: 5, fail: 1,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			r := Evaluate(tt.in)

			if r.Score != tt.score || r.PassCount != tt.pass || r.WarnCount != tt.warn || r.FailCount != tt.fail {
				t.Errorf("got score=%d pass=%d warn=%d fail=%d, want score=%d pass=%d warn=%d fail=%d",
					r.Score, r.PassCount, r.WarnCount, r.FailCount, tt.score, tt.pass, tt.warn, tt.fail)
			}
		})
	}
}

func TestOpenPortsAreSorted(t *testing.T) {
	c := checkPorts(Input{PortBindings: []PortBinding{{HostPort: "9444"}, {HostPort: "9001"}}})

	if want := "9001 and 9444 listen on 0.0.0.0"; c.Description != want {
		t.Errorf("got %q, want %q", c.Description, want)
	}
}

func TestUsesLatestTag(t *testing.T) {
	for image, want := range map[string]bool{
		"nginx":                         true,
		"nginx:latest":                  true,
		"nginx:1.27":                    false,
		"localhost:5000/app":            true,
		"localhost:5000/app:2.0":        false,
		"nginx@sha256:abcdef0123456789": false,
	} {
		if got := usesLatestTag(image); got != want {
			t.Errorf("usesLatestTag(%q) = %v, want %v", image, got, want)
		}
	}
}

func TestPortsOnlyWarnWhenPublishedOnAllInterfaces(t *testing.T) {
	tests := []struct {
		name    string
		binding PortBinding
		want    Status
	}{
		{
			name:    "all interfaces",
			binding: PortBinding{HostIP: "0.0.0.0", HostPort: "8080"},
			want:    StatusWarn,
		},
		{
			name:    "empty host IP",
			binding: PortBinding{HostIP: "", HostPort: "8080"},
			want:    StatusWarn,
		},
		{
			name:    "localhost only",
			binding: PortBinding{HostIP: "127.0.0.1", HostPort: "8080"},
			want:    StatusPass,
		},
		{
			name:    "not published",
			binding: PortBinding{HostIP: "0.0.0.0", HostPort: ""},
			want:    StatusPass,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := checkPorts(Input{PortBindings: []PortBinding{tt.binding}})
			if got.Status != tt.want {
				t.Errorf("got status %q, want %q", got.Status, tt.want)
			}
		})
	}
}

func TestDockerSocketDetection(t *testing.T) {
	tests := []struct {
		name string
		in   Input
		want Status
	}{
		{
			name: "socket in binds",
			in:   Input{Binds: []string{"/var/run/docker.sock:/var/run/docker.sock"}},
			want: StatusWarn,
		},
		{
			name: "socket in mount sources",
			in:   Input{MountSources: []string{"/var/run/docker.sock"}},
			want: StatusWarn,
		},
		{
			name: "no socket",
			in:   Input{Binds: []string{"/tmp:/tmp"}},
			want: StatusPass,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := checkDockerSocket(tt.in)
			if got.Status != tt.want {
				t.Errorf("got status %q, want %q", got.Status, tt.want)
			}
		})
	}
}

func TestPrivilegedContainerFails(t *testing.T) {
	got := checkPrivileged(Input{Privileged: true})

	if got.Status != StatusFail {
		t.Errorf("got status %q, want %q", got.Status, StatusFail)
	}
}
