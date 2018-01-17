package http

import (
	"net/http"
)

// HealthCheck GETs /api/status
func HealthCheck(addr string) (int, error) {
	resp, err := http.Get("http://" + addr + "/api/status")
	return resp.StatusCode, err
}
