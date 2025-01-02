package networking

import (
	"encoding/json"
	"strings"
	"testing"
	"time"
)

// Response structs for each function
type dnsResponse struct {
	Operation   string   `json:"operation"`
	ResolvedIPs []string `json:"resolved_ips"`
	RemoteAddr  string   `json:"remote_address"`
	ConnectedAt string   `json:"connected_at"`
	Status      string   `json:"status"`
}

type telnetResponse struct {
	Operation   string `json:"operation"`
	LocalAddr   string `json:"local_address"`
	RemoteAddr  string `json:"remote_address"`
	Network     string `json:"network"`
	Status      string `json:"status"`
	ConnectedAt string `json:"connected_at"`
}

type proxyResponse struct {
	Operation   string `json:"operation"`
	LocalAddr   string `json:"local_address"`
	RemoteAddr  string `json:"remote_address"`
	Network     string `json:"network"`
	Status      string `json:"status"`
	ConnectedAt string `json:"connected_at"`
}

func TestProbeDNSConnection(t *testing.T) {
	tests := []struct {
		name           string
		host           string
		wantSuccess    bool
		statusContains string
	}{
		{
			name:           "Valid domain",
			host:           "https://api.portainer.io",
			wantSuccess:    true,
			statusContains: "dns lookup successful",
		},
		{
			name:           "Invalid domain",
			host:           "https://nonexistent.domain.invalid",
			wantSuccess:    false,
			statusContains: "dns lookup failed",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			response := ProbeDNSConnection(tt.host)

			var result dnsResponse
			if err := json.Unmarshal([]byte(response), &result); err != nil {
				t.Fatalf("Invalid JSON response: %v", err)
			}

			if !strings.Contains(result.Status, tt.statusContains) {
				t.Errorf("Status should contain '%s', got: %s", tt.statusContains, result.Status)
			}
		})
	}
}

func TestProbeTelnetConnection(t *testing.T) {
	tests := []struct {
		name           string
		url            string
		wantSuccess    bool
		statusContains string
	}{
		{
			name:           "Valid connection",
			url:            "https://api.portainer.io",
			wantSuccess:    true,
			statusContains: "connected to",
		},
		{
			name:           "Invalid port",
			url:            "https://api.portainer.io:99999",
			wantSuccess:    false,
			statusContains: "failed to connect",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			response := ProbeTelnetConnection(tt.url)

			var result telnetResponse
			if err := json.Unmarshal([]byte(response), &result); err != nil {
				t.Fatalf("Invalid JSON response: %v", err)
			}

			validateCommonFields(t, result.Operation, "telnet connection", result.ConnectedAt)
			if !strings.Contains(result.Status, tt.statusContains) {
				t.Errorf("Status should contain '%s', got: %s", tt.statusContains, result.Status)
			}
		})
	}
}

func TestDetectProxy(t *testing.T) {
	tests := []struct {
		name           string
		url            string
		wantSuccess    bool
		statusContains string
	}{
		{
			name:           "Valid URL",
			url:            "https://api.portainer.io",
			wantSuccess:    true,
			statusContains: "proxy",
		},
		{
			name:           "Invalid URL",
			url:            "https://nonexistent.domain.invalid",
			wantSuccess:    false,
			statusContains: "failed to make request",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			response := DetectProxy(tt.url)

			var result proxyResponse
			if err := json.Unmarshal([]byte(response), &result); err != nil {
				t.Fatalf("Invalid JSON response: %v", err)
			}

			validateCommonFields(t, result.Operation, "proxy detection", result.ConnectedAt)
			if result.Network != "https" {
				t.Errorf("Expected network https, got %s", result.Network)
			}
			if !strings.Contains(result.Status, tt.statusContains) {
				t.Errorf("Status should contain '%s', got: %s", tt.statusContains, result.Status)
			}
		})
	}
}

// Helper function to validate common fields across all responses
func validateCommonFields(t *testing.T, operation, expectedOperation, connectedAt string) {
	t.Helper()

	if operation != expectedOperation {
		t.Errorf("Expected operation '%s', got '%s'", expectedOperation, operation)
	}

	if _, err := time.Parse(time.RFC3339, connectedAt); err != nil {
		t.Errorf("Invalid connected_at timestamp: %v", err)
	}
}
