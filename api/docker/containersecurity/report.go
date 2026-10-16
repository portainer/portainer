// Package containersecurity evaluates the security configuration of a Docker container.
package containersecurity

import "math"

// Status is the result of a single security check.
type Status string

const (
	StatusPass Status = "pass"
	StatusWarn Status = "warn"
	StatusFail Status = "fail"
)

// Check is the result of one security check.
type Check struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Risk        string `json:"risk"`
	Fix         string `json:"fix"`
	Status      Status `json:"status"`
	Weight      int    `json:"weight"`
}

// Report is the full security evaluation of a container.
type Report struct {
	Score     int     `json:"score"`
	PassCount int     `json:"passCount"`
	WarnCount int     `json:"warnCount"`
	FailCount int     `json:"failCount"`
	Checks    []Check `json:"checks"`
}

// PortBinding is a published port of a container.
type PortBinding struct {
	HostIP   string
	HostPort string
}

// Input holds the container settings the checks need.
type Input struct {
	Image          string
	User           string
	MemoryLimit    int64
	NanoCPUs       int64 // New: CPU limit in nano CPUs
	Privileged     bool
	ReadonlyRootfs bool
	Binds          []string
	MountSources   []string
	PortBindings   []PortBinding
	CapAdd         []string // New: added capabilities
	CapDrop        []string // New: dropped capabilities
	NetworkMode    string   // New: network mode (host, bridge, none...)
	SecurityOpt    []string // New: AppArmor / Seccomp options
}

// pointsByStatus returns the percentage of the weight to give based on status.
func pointsByStatus(status Status) float64 {
	switch status {
	case StatusPass:
		return 1.0
	case StatusWarn:
		return 0.5
	case StatusFail:
		return 0.0
	default:
		return 0.0
	}
}

// Evaluate runs all the security checks and computes a weighted score.
func Evaluate(in Input) Report {
	checks := []Check{
		checkMemory(in),
		checkCPU(in),
		checkPrivileged(in),
		checkDockerSocket(in),
		checkPorts(in),
		checkRootUser(in),
		checkReadonlyRootfs(in),
		checkImageTag(in),
		checkCapabilities(in),
		checkNetworkMode(in),
	}

	report := Report{Checks: checks}
	totalWeight := 0
	earnedPoints := 0.0

	for i := range checks {
		// Assign weights based on severity
		switch checks[i].ID {
		case "privileged", "socket":
			checks[i].Weight = 25 // Critical
		case "memory", "root", "capabilities", "network":
			checks[i].Weight = 15 // High
		case "ports", "readonly", "cpu":
			checks[i].Weight = 10 // Medium
		case "latest":
			checks[i].Weight = 5 // Low
		default:
			checks[i].Weight = 10
		}

		totalWeight += checks[i].Weight
		earnedPoints += float64(checks[i].Weight) * pointsByStatus(checks[i].Status)

		switch checks[i].Status {
		case StatusPass:
			report.PassCount++
		case StatusWarn:
			report.WarnCount++
		case StatusFail:
			report.FailCount++
		}
	}

	if totalWeight > 0 {
		report.Score = int(math.Round((earnedPoints / float64(totalWeight)) * 100))
	}

	return report
}
