package containersecurity

import (
	"fmt"
	"net"
	"slices"
	"strings"
)

func checkMemory(in Input) Check {
	c := Check{
		ID:          "memory",
		Title:       "No memory limit",
		Description: "Set a limit so one container can't starve the host",
		Risk:        "A container without a limit can use all the host memory and crash other containers.",
		Fix:         "Run it with --memory 256m (choose a value that fits your app).",
		Status:      StatusFail,
	}
	if in.MemoryLimit > 0 {
		c.Title = "Memory limit set"
		c.Description = "A memory limit protects the host from this container"
		c.Status = StatusPass
	}
	return c
}

func checkCPU(in Input) Check {
	c := Check{
		ID:          "cpu",
		Title:       "No CPU limit",
		Description: "Set a CPU limit so one container can't starve the host",
		Risk:        "A container without a CPU limit can consume all CPU and slow down other containers.",
		Fix:         "Run it with --cpus 1.0 (choose a value that fits your app); --cpu-shares only sets relative CPU weight.",
		Status:      StatusWarn,
	}
	if in.NanoCPUs > 0 {
		c.Title = "CPU limit set"
		c.Description = "A CPU limit protects the host from this container"
		c.Status = StatusPass
	}
	return c
}

func checkPrivileged(in Input) Check {
	c := Check{
		ID:          "privileged",
		Title:       "Not privileged",
		Description: "Privileged mode is off",
		Risk:        "Privileged mode removes most isolation, so a compromised container can take over the host.",
		Fix:         "Remove --privileged and add only the specific capabilities you need with --cap-add.",
		Status:      StatusPass,
	}
	if in.Privileged {
		c.Title = "Privileged mode is on"
		c.Description = "Privileged containers have almost full access to the host"
		c.Status = StatusFail
	}
	return c
}

func checkDockerSocket(in Input) Check {
	c := Check{
		ID:          "socket",
		Title:       "Docker socket not mounted",
		Description: "The container cannot control the Docker daemon",
		Risk:        "Whoever controls this container can control Docker, and therefore the whole host.",
		Fix:         "Do not mount /var/run/docker.sock unless the container really needs it, or put a Docker socket proxy in front of it.",
		Status:      StatusPass,
	}
	if slices.ContainsFunc(in.MountSources, hasDockerSock) || slices.ContainsFunc(in.Binds, hasDockerSock) {
		c.Title = "Docker socket mounted"
		c.Description = "Gives this container control over the whole host"
		c.Status = StatusFail
	}
	return c
}

func checkPorts(in Input) Check {
	c := Check{
		ID:          "ports",
		Title:       "No ports exposed on all interfaces",
		Description: "No published ports listen on every interface",
		Risk:        "Ports on 0.0.0.0 are reachable from every network the host is connected to, not only from your machine.",
		Fix:         "Bind to localhost, for example -p 127.0.0.1:8080:80, or put a firewall or reverse proxy in front.",
		Status:      StatusPass,
	}
	var open []string
	for _, b := range in.PortBindings {
		if isAllInterfaces(b.HostIP) && b.HostPort != "" {
			open = append(open, b.HostPort)
		}
	}
	slices.Sort(open)
	open = slices.Compact(open)
	if len(open) > 0 {
		c.Title = "Ports open on all interfaces"
		c.Description = strings.Join(open, " and ") + " listen on all host interfaces"
		c.Status = StatusWarn
	}
	return c
}

func checkRootUser(in Input) Check {
	user, _, _ := strings.Cut(in.User, ":")
	c := Check{
		ID:          "root",
		Title:       "Runs as non-root user",
		Description: fmt.Sprintf("Running as user %q", in.User),
		Risk:        "If an attacker breaks into the app, they become root inside the container, which makes escaping easier.",
		Fix:         "Run as a normal user with --user 1000, or set USER in the Dockerfile.",
		Status:      StatusPass,
	}
	if user == "" || user == "root" || user == "0" {
		c.Title = "Runs as root"
		c.Description = "The main process runs as the root user"
		c.Status = StatusWarn
	}
	return c
}

func checkReadonlyRootfs(in Input) Check {
	c := Check{
		ID:          "readonly",
		Title:       "Writable root filesystem",
		Description: "Consider making the root filesystem read-only",
		Risk:        "A bug or malware can modify the container files, install tools, or hide changes.",
		Fix:         "Add --read-only, and use --tmpfs /tmp or a volume for folders that must be writable.",
		Status:      StatusWarn,
	}
	if in.ReadonlyRootfs {
		c.Title = "Read-only root filesystem"
		c.Description = "The container cannot modify its own filesystem"
		c.Status = StatusPass
	}
	return c
}

func checkImageTag(in Input) Check {
	c := Check{
		ID:          "latest",
		Title:       "Image tag is pinned",
		Description: fmt.Sprintf("Image %q", in.Image),
		Risk:        "The latest tag changes over time, so you cannot know which version is running and an update can break things silently.",
		Fix:         "Pin a specific version such as nginx:1.27, or an image digest (@sha256:...).",
		Status:      StatusPass,
	}
	if usesLatestTag(in.Image) {
		c.Title = "Image tag is latest"
		c.Description = fmt.Sprintf("Image %q has no fixed version", in.Image)
		c.Status = StatusWarn
	}
	return c
}

func checkCapabilities(in Input) Check {
	dangerousCaps := []string{
		"SYS_ADMIN", "NET_ADMIN", "SYS_MODULE", "SYS_PTRACE",
		"SYS_RAWIO", "SYS_TIME", "MKNOD", "AUDIT_WRITE", "NET_RAW",
	}
	c := Check{
		ID:          "capabilities",
		Title:       "No dangerous capabilities",
		Description: "No high-risk capabilities were added",
		Risk:        "Dangerous capabilities can allow a container to escape or attack the host.",
		Fix:         "Drop all capabilities with --cap-drop=ALL and only add the ones you really need.",
		Status:      StatusPass,
	}
	droppedAll := false
	for _, d := range in.CapDrop {
		if strings.EqualFold(d, "ALL") || strings.EqualFold(d, "CAP_ALL") {
			droppedAll = true
			break
		}
	}
	var found []string
	for _, cap := range in.CapAdd {
		cap = strings.TrimPrefix(strings.ToUpper(strings.TrimSpace(cap)), "CAP_")
		if cap == "ALL" || slices.Contains(dangerousCaps, cap) {
			found = append(found, cap)
		}
	}
	if len(found) > 0 {
		c.Title = "Dangerous capabilities added"
		c.Description = "Added: " + strings.Join(found, ", ")
		c.Status = StatusFail
	} else if droppedAll {
		c.Title = "All capabilities dropped"
		c.Description = "Container runs with --cap-drop=ALL (best practice)"
		c.Status = StatusPass
	}
	return c
}

func checkNetworkMode(in Input) Check {
	c := Check{
		ID:          "network",
		Title:       "Network mode is isolated",
		Description: "Container is not using host network",
		Risk:        "Host network mode removes network isolation and exposes all host interfaces to the container.",
		Fix:         "Avoid --network=host unless absolutely required. Prefer bridge or custom networks.",
		Status:      StatusPass,
	}
	if strings.EqualFold(in.NetworkMode, "host") {
		c.Title = "Using host network mode"
		c.Description = "Container shares the host's network stack"
		c.Status = StatusFail
	}
	return c
}

func checkSeccomp(in Input) Check {
	c := Check{
		ID:          "seccomp",
		Title:       "Seccomp profile active",
		Description: "Default or custom seccomp profile is in use",
		Risk:        "Disabling seccomp removes an important layer of syscall filtering and makes container escapes easier.",
		Fix:         "Do not set --security-opt seccomp=unconfined. Prefer the default profile or a tighter custom profile.",
		Status:      StatusPass,
	}

	appArmorDisabled := false

	for _, opt := range in.SecurityOpt {
		lower := strings.ToLower(strings.TrimSpace(opt))

		if lower == "seccomp=unconfined" ||
			lower == "seccomp:unconfined" {
			c.Title = "Seccomp is disabled"
			c.Description = "seccomp=unconfined removes syscall filtering"
			c.Status = StatusFail
			return c
		}

		if lower == "apparmor=unconfined" ||
			lower == "apparmor:unconfined" {
			appArmorDisabled = true
		}
	}

	if appArmorDisabled {
		c.Title = "AppArmor is disabled"
		c.Description = "apparmor=unconfined removes mandatory access control"
		c.Status = StatusWarn
	}

	return c
}

func hasDockerSock(s string) bool {
	return strings.Contains(s, "docker.sock")
}

func isAllInterfaces(ip string) bool {
	ip = strings.TrimSpace(ip)
	if ip == "" {
		return true
	}
	parsed := net.ParseIP(ip)
	return parsed != nil && parsed.IsUnspecified()
}

func usesLatestTag(image string) bool {
	if image == "" || strings.Contains(image, "@sha256:") {
		return false
	}
	lastSegment := image[strings.LastIndex(image, "/")+1:]
	i := strings.LastIndex(lastSegment, ":")
	if i == -1 {
		return true
	}
	tag := lastSegment[i+1:]
	return tag == "" || tag == "latest"
}
