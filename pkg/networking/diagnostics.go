package networking

import (
	"crypto/tls"
	"fmt"
	"net"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/segmentio/encoding/json"
)

// ProbeDNSConnection probes a DNS connection and returns a JSON string with the DNS lookup status and IP addresses.
// ignores errors for the dns lookup since we want to know if the host is reachable
func ProbeDNSConnection(url string) string {
	_, host, _ := parseURL(url)
	result := map[string]interface{}{
		"operation":      "dns lookup",
		"remote_address": host,
		"connected_at":   time.Now().Format(time.RFC3339),
		"status":         "dns lookup successful",
		"resolved_ips":   []net.IP{},
	}

	ipAddresses, err := net.LookupIP(host)
	if err != nil {
		result["status"] = fmt.Sprintf("dns lookup failed: %s", err)
	} else {
		result["resolved_ips"] = ipAddresses
	}

	jsonData, _ := json.Marshal(result)
	return string(jsonData)
}

// ProbeTelnetConnection probes a telnet connection and returns a JSON string with the telnet connection status, local and remote addresses.
// ignores errors for the telnet connection since we want to know if the host is reachable
func ProbeTelnetConnection(url string) string {
	network, host, port := parseURL(url)
	if network == "https" || network == "http" {
		network = "tcp"
	}

	address := fmt.Sprintf("%s:%s", host, port)
	result := map[string]string{
		"operation":      "telnet connection",
		"local_address":  "unknown",
		"remote_address": "unknown",
		"network":        network,
		"status":         "connected to " + address,
		"connected_at":   time.Now().Format(time.RFC3339),
	}

	connection, err := net.DialTimeout(network, address, 5*time.Second)
	if err != nil {
		result["status"] = fmt.Sprintf("failed to connect to %s: %s", address, err)
	} else {
		defer connection.Close()
		result["local_address"] = connection.LocalAddr().String()
		result["remote_address"] = connection.RemoteAddr().String()
	}

	jsonData, _ := json.Marshal(result)
	return string(jsonData)
}

// DetectProxy probes a target URL and returns a JSON string with the proxy detection status, local and remote addresses.
// ignores errors for the http request since we want to know if the host is reachable
func DetectProxy(url string) string {
	client := &http.Client{
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{
				InsecureSkipVerify: true,
			},
		},
		Timeout: 10 * time.Second,
	}

	result := map[string]string{
		"operation":      "proxy detection",
		"local_address":  "unknown",
		"remote_address": "unknown",
		"network":        "https",
		"status":         "no proxy detected",
		"connected_at":   time.Now().Format(time.RFC3339),
	}

	resp, err := client.Get(url)
	if err != nil {
		result["status"] = fmt.Sprintf("failed to make request: %s", err)
	} else {
		defer resp.Body.Close()

		if resp.Request != nil {
			result["local_address"] = resp.Request.Host
			result["remote_address"] = resp.Request.RemoteAddr
		}

		if resp.Header.Get("Via") != "" || resp.Header.Get("X-Forwarded-For") != "" || resp.Header.Get("Proxy-Connection") != "" {
			result["status"] = "proxy detected via headers"
		} else if resp.TLS != nil && len(resp.TLS.PeerCertificates) > 0 {
			cert := resp.TLS.PeerCertificates[0]
			if cert.IsCA || strings.Contains(strings.ToLower(cert.Issuer.CommonName), "proxy") {
				result["status"] = "proxy detected via certificate"
			}
		}
	}

	jsonData, _ := json.Marshal(result)
	return string(jsonData)
}

// parseURL parses a raw URL and returns the network, host and port
// it also ensures the network is tcp and the port is set to the default for the network
func parseURL(rawURL string) (network, host, port string) {
	u, err := url.Parse(rawURL)
	if err != nil {
		return "", "", ""
	}

	network = u.Scheme
	host = u.Hostname()
	port = u.Port()

	if port == "" {
		if network == "https" {
			port = "443"
		} else if network == "http" {
			port = "80"
		}
	}

	return network, host, port
}
