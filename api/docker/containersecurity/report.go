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

// Every check is worth 100 (pass), 50 (warn) or 0 (fail) points,
// and the score is the average over all checks.
var pointsByStatus = map[Status]int{
	StatusPass: 100,
	StatusWarn: 50,
	StatusFail: 0,
}

// Check is the result of one security check.
type Check struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Risk        string `json:"risk"`
	Fix         string `json:"fix"`
	Status      Status `json:"status"`
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

// Input holds the container settings the checks need, so the checks do not
// depend on the Docker SDK types.
type Input struct {
	Image          string
	User           string
	MemoryLimit    int64
	Privileged     bool
	ReadonlyRootfs bool
	Binds          []string
	MountSources   []string
	PortBindings   []PortBinding
}

// Evaluate runs all the security checks and computes the score.
func Evaluate(in Input) Report {
	checks := []Check{
		checkMemory(in),
		checkPrivileged(in),
		checkDockerSocket(in),
		checkPorts(in),
		checkRootUser(in),
		checkReadonlyRootfs(in),
		checkImageTag(in),
	}

	report := Report{Checks: checks}
	total := 0

	for _, c := range checks {
		total += pointsByStatus[c.Status]

		switch c.Status {
		case StatusPass:
			report.PassCount++
		case StatusWarn:
			report.WarnCount++
		case StatusFail:
			report.FailCount++
		}
	}

	report.Score = int(math.Round(float64(total) / float64(len(checks))))

	return report
}
