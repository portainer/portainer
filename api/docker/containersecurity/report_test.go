package containersecurity

import "testing"

func TestEvaluate(t *testing.T) {
	tests := []struct {
		name                    string
		in                      Input
		opts                    *Options
		score, pass, warn, fail int
	}{
		{
			name: "fully hardened container",
			in: Input{
				Image:          "nginx:1.27",
				User:           "1000",
				MemoryLimit:    256 << 20,
				NanoCPUs:       1_000_000_000,
				ReadonlyRootfs: true,
				CapDrop:        []string{"ALL"},
			},
			score: 100, pass: 11, warn: 0, fail: 0,
		},
		{
			name:  "container with defaults",
			in:    Input{Image: "alpine:latest"},
			score: 77, pass: 6, warn: 4, fail: 1,
		},
		{
			name: "portainer-like container",
			in: Input{
				Image:        "portainer/portainer-ce:latest",
				Binds:        []string{"/var/run/docker.sock:/var/run/docker.sock"},
				PortBindings: []PortBinding{{HostIP: "0.0.0.0", HostPort: "9444"}, {HostIP: "", HostPort: "9001"}},
			},
			score: 57, pass: 4, warn: 5, fail: 2,
		},
		{
			name: "ignore critical checks",
			in: Input{
				Image:      "alpine:latest",
				Privileged: true,
				Binds:      []string{"/var/run/docker.sock:/var/run/docker.sock"},
			},
			opts:  &Options{IgnoreChecks: []string{"privileged", "socket"}},
			score: 65, pass: 4, warn: 4, fail: 1,
		},
		{
			name: "min severity high",
			in: Input{
				Image: "nginx:1.27",
				User:  "1000",
			},
			opts:  &Options{MinSeverity: SeverityHigh},
			score: 83, pass: 5, warn: 0, fail: 1,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			r := Evaluate(tt.in, tt.opts)
			if r.Score != tt.score || r.PassCount != tt.pass || r.WarnCount != tt.warn || r.FailCount != tt.fail {
				t.Errorf("got score=%d pass=%d warn=%d fail=%d, want score=%d pass=%d warn=%d fail=%d",
					r.Score, r.PassCount, r.WarnCount, r.FailCount, tt.score, tt.pass, tt.warn, tt.fail)
				for _, c := range r.Checks {
					t.Logf("  %s weight=%d status=%s severity=%s", c.ID, c.Weight, c.Status, c.Severity)
				}
			}
		})
	}
}

func TestOpenPortsAreSorted(t *testing.T) {
	c := checkPorts(Input{PortBindings: []PortBinding{{HostPort: "9444"}, {HostPort: "9001"}}})
	if want := "9001 and 9444 listen on all host interfaces"; c.Description != want {
		t.Errorf("got %q, want %q", c.Description, want)
	}
}

func TestUsesLatestTag(t *testing.T) {
	for image, want := range map[string]bool{
		"nginx": true, "nginx:latest": true, "nginx:1.27": false,
		"localhost:5000/app": true, "localhost:5000/app:2.0": false,
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
		{"all interfaces", PortBinding{HostIP: "0.0.0.0", HostPort: "8080"}, StatusWarn},
		{"empty host IP", PortBinding{HostIP: "", HostPort: "8080"}, StatusWarn},
		{"localhost only", PortBinding{HostIP: "127.0.0.1", HostPort: "8080"}, StatusPass},
		{"not published", PortBinding{HostIP: "0.0.0.0", HostPort: ""}, StatusPass},
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
		{"socket in binds", Input{Binds: []string{"/var/run/docker.sock:/var/run/docker.sock"}}, StatusFail},
		{"socket in mount sources", Input{MountSources: []string{"/var/run/docker.sock"}}, StatusFail},
		{"no socket", Input{Binds: []string{"/tmp:/tmp"}}, StatusPass},
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

func TestCapabilitiesWithCapDropAll(t *testing.T) {
	got := checkCapabilities(Input{CapDrop: []string{"ALL"}})
	if got.Status != StatusPass {
		t.Errorf("expected Pass when CapDrop=ALL, got %s", got.Status)
	}
}

func TestSeccompUnconfined(t *testing.T) {
	got := checkSeccomp(Input{SecurityOpt: []string{"seccomp=unconfined"}})
	if got.Status != StatusFail {
		t.Errorf("expected Fail for seccomp=unconfined, got %s", got.Status)
	}
}

func TestIgnoreChecks(t *testing.T) {
	r := Evaluate(Input{Privileged: true}, &Options{IgnoreChecks: []string{"privileged"}})
	for _, c := range r.Checks {
		if c.ID == "privileged" {
			t.Fatal("privileged check should have been ignored")
		}
	}
}

func TestSeccompTakesPriorityOverAppArmor(t *testing.T) {
	got := checkSeccomp(Input{
		SecurityOpt: []string{
			"apparmor=unconfined",
			"seccomp=unconfined",
		},
	})

	if got.Status != StatusFail {
		t.Errorf("expected Fail when both protections are disabled, got %s", got.Status)
	}
}

func TestIsAllInterfaces(t *testing.T) {
	tests := []struct {
		name string
		ip   string
		want bool
	}{
		{name: "empty IP", ip: "", want: true},
		{name: "IPv4 all interfaces", ip: "0.0.0.0", want: true},
		{name: "IPv6 all interfaces", ip: "::", want: true},
		{name: "localhost IPv4", ip: "127.0.0.1", want: false},
		{name: "localhost IPv6", ip: "::1", want: false},
		{name: "invalid IP", ip: "invalid IP", want: false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := isAllInterfaces(tt.ip); got != tt.want {
				t.Errorf("isAllInterfaces(%q) = %v, want %v", tt.ip, got, tt.want)
			}
		})
	}
}

func TestMinSeverityDoesNotChangeOverallScore(t *testing.T) {
	in := Input{}
	full := Evaluate(in, nil)
	filtered := Evaluate(in, &Options{MinSeverity: SeverityCritical})

	if filtered.Score != full.Score {
		t.Errorf("minSeverity changed overall score: full=%d, filtered=%d", full.Score, filtered.Score)
	}
	if len(filtered.Checks) >= len(full.Checks) {
		t.Errorf("expected minSeverity to filter checks: full=%d, filtered=%d", len(full.Checks), len(filtered.Checks))
	}
}

func TestCapabilitiesNormalizeNames(t *testing.T) {
	tests := []string{
		"SYS_ADMIN", "NET_ADMIN", "SYS_MODULE", "SYS_PTRACE",
		"SYS_RAWIO", "SYS_TIME", "MKNOD", "AUDIT_WRITE", "NET_RAW",
		"CAP_NET_ADMIN", "cap_net_admin", " cap_net_admin ",
	}

	for _, cap := range tests {
		t.Run(cap, func(t *testing.T) {
			got := checkCapabilities(Input{CapAdd: []string{cap}})
			if got.Status != StatusFail {
				t.Errorf("CapAdd %q: got %s, want %s", cap, got.Status, StatusFail)
			}
		})
	}
}

func TestDangerousCapabilityFailsEvenWhenAllAreDropped(t *testing.T) {
	got := checkCapabilities(Input{
		CapAdd:  []string{"cap_net_admin"},
		CapDrop: []string{"ALL"},
	})
	if got.Status != StatusFail {
		t.Errorf("got %s, want %s", got.Status, StatusFail)
	}
}

func TestCheckCapabilitiesFlagsAll(t *testing.T) {
	c := checkCapabilities(Input{CapAdd: []string{"ALL"}})
	if c.Status != StatusFail {
		t.Errorf("CapAdd ALL: got status=%s, want %s", c.Status, StatusFail)
	}
}
