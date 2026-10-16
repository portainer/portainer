// Package containersecurity evaluates the security configuration of a Docker container.
package containersecurity

import (
	"math"
	"slices"
)

// Status is the result of a single security check.
type Status string

const (
	StatusPass Status = "pass"
	StatusWarn Status = "warn"
	StatusFail Status = "fail"
)

// Severity indicates how critical a check is.
type Severity string

const (
	SeverityCritical Severity = "critical"
	SeverityHigh     Severity = "high"
	SeverityMedium   Severity = "medium"
	SeverityLow      Severity = "low"
)

// Check is the result of one security check.
type Check struct {
	ID          string   `json:"id"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Risk        string   `json:"risk"`
	Fix         string   `json:"fix"`
	Status      Status   `json:"status"`
	Severity    Severity `json:"severity"`
	Weight      int      `json:"weight"`
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
	NanoCPUs       int64
	Privileged     bool
	ReadonlyRootfs bool
	Binds          []string
	MountSources   []string
	PortBindings   []PortBinding
	CapAdd         []string
	CapDrop        []string
	NetworkMode    string
	SecurityOpt    []string
}

// Options controls which checks are evaluated.
type Options struct {
	IgnoreChecks []string
	MinSeverity  Severity
}

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

func severityRank(s Severity) int {
	switch s {
	case SeverityCritical:
		return 4
	case SeverityHigh:
		return 3
	case SeverityMedium:
		return 2
	case SeverityLow:
		return 1
	default:
		return 0
	}
}

func defaultWeightAndSeverity(id string) (weight int, severity Severity) {
	switch id {
	case "privileged", "socket":
		return 25, SeverityCritical
	case "memory", "root", "capabilities", "network":
		return 15, SeverityHigh
	case "ports", "readonly", "cpu":
		return 10, SeverityMedium
	case "latest", "seccomp":
		return 5, SeverityLow
	default:
		return 10, SeverityMedium
	}
}

// Evaluate runs all security checks and computes a weighted score.
func Evaluate(in Input, opts *Options) Report {
	if opts == nil {
		opts = &Options{}
	}

	allChecks := []Check{
		checkPrivileged(in),
		checkDockerSocket(in),
		checkMemory(in),
		checkRootUser(in),
		checkCapabilities(in),
		checkNetworkMode(in),
		checkPorts(in),
		checkReadonlyRootfs(in),
		checkCPU(in),
		checkImageTag(in),
		checkSeccomp(in),
	}

	report := Report{}
	totalWeight := 0
	earnedPoints := 0.0

	for _, c := range allChecks {
		if slices.Contains(opts.IgnoreChecks, c.ID) {
			continue
		}

		c.Weight, c.Severity = defaultWeightAndSeverity(c.ID)

		if opts.MinSeverity != "" && severityRank(c.Severity) < severityRank(opts.MinSeverity) {
			continue
		}

		totalWeight += c.Weight
		earnedPoints += float64(c.Weight) * pointsByStatus(c.Status)

		switch c.Status {
		case StatusPass:
			report.PassCount++
		case StatusWarn:
			report.WarnCount++
		case StatusFail:
			report.FailCount++
		}

		report.Checks = append(report.Checks, c)
	}

	if totalWeight > 0 {
		report.Score = int(math.Round((earnedPoints / float64(totalWeight)) * 100))
	}

	return report
}
