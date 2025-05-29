package factory

import (
	"net/http"
	"net/url"
	"testing"

	"github.com/google/go-cmp/cmp"
	portainer "github.com/portainer/portainer/api"
)

func Test_createDirector(t *testing.T) {
	testCases := []struct {
		name        string
		target      *url.URL
		req         *http.Request
		expectedReq *http.Request
	}{
		{
			name:   "base case",
			target: createURL(t, "https://portainer.io/api/docker?a=5&b=6"),
			req: createRequest(
				t,
				"GET",
				"https://agent-portainer.io/test?c=7",
				map[string]string{"Accept-Encoding": "gzip", "Accept": "application/json", "User-Agent": "something"},
				true,
			),
			expectedReq: createRequest(
				t,
				"GET",
				"https://portainer.io/api/docker/test?a=5&b=6&c=7",
				map[string]string{"Accept-Encoding": "gzip", "Accept": "application/json", "User-Agent": "something"},
				true,
			),
		},
		{
			name:   "no User-Agent",
			target: createURL(t, "https://portainer.io/api/docker?a=5&b=6"),
			req: createRequest(
				t,
				"GET",
				"https://agent-portainer.io/test?c=7",
				map[string]string{"Accept-Encoding": "gzip", "Accept": "application/json"},
				true,
			),
			expectedReq: createRequest(
				t,
				"GET",
				"https://portainer.io/api/docker/test?a=5&b=6&c=7",
				map[string]string{"Accept-Encoding": "gzip", "Accept": "application/json", "User-Agent": ""},
				true,
			),
		},
		{
			name:   "Sensitive Headers",
			target: createURL(t, "https://portainer.io/api/docker?a=5&b=6"),
			req: createRequest(
				t,
				"GET",
				"https://agent-portainer.io/test?c=7",
				map[string]string{
					"Authorization":           "secret",
					"Proxy-Authorization":     "secret",
					"Cookie":                  "secret",
					"X-Csrf-Token":            "secret",
					"X-Api-Key":               "secret",
					"Accept":                  "application/json",
					"Accept-Encoding":         "gzip",
					"Accept-Language":         "en-GB",
					"Cache-Control":           "None",
					"Content-Length":          "100",
					"Content-Type":            "application/json",
					"Private-Token":           "test-private-token",
					"User-Agent":              "test-user-agent",
					"X-Portaineragent-Target": "test-agent-1",
					"X-Portainer-Volumename":  "test-volume-1",
					"X-Registry-Auth":         "test-registry-auth",
				},
				true,
			),
			expectedReq: createRequest(
				t,
				"GET",
				"https://portainer.io/api/docker/test?a=5&b=6&c=7",
				map[string]string{
					"Accept":                  "application/json",
					"Accept-Encoding":         "gzip",
					"Accept-Language":         "en-GB",
					"Cache-Control":           "None",
					"Content-Length":          "100",
					"Content-Type":            "application/json",
					"Private-Token":           "test-private-token",
					"User-Agent":              "test-user-agent",
					"X-Portaineragent-Target": "test-agent-1",
					"X-Portainer-Volumename":  "test-volume-1",
					"X-Registry-Auth":         "test-registry-auth",
				},
				true,
			),
		},
		{
			name:   "Non canonical Headers",
			target: createURL(t, "https://portainer.io/api/docker?a=5&b=6"),
			req: createRequest(
				t,
				"GET",
				"https://agent-portainer.io/test?c=7",
				map[string]string{
					"Accept":                             "application/json",
					"Accept-Encoding":                    "gzip",
					"Accept-Language":                    "en-GB",
					"Cache-Control":                      "None",
					"Content-Length":                     "100",
					"Content-Type":                       "application/json",
					"Private-Token":                      "test-private-token",
					"User-Agent":                         "test-user-agent",
					portainer.PortainerAgentTargetHeader: "test-agent-1",
					"X-Portainer-VolumeName":             "test-volume-1",
					"X-Registry-Auth":                    "test-registry-auth",
				},
				false,
			),
			expectedReq: createRequest(
				t,
				"GET",
				"https://portainer.io/api/docker/test?a=5&b=6&c=7",
				map[string]string{
					"Accept":          "application/json",
					"Accept-Encoding": "gzip",
					"Accept-Language": "en-GB",
					"Cache-Control":   "None",
					"Content-Length":  "100",
					"Content-Type":    "application/json",
					"Private-Token":   "test-private-token",
					"User-Agent":      "test-user-agent",
					"X-Registry-Auth": "test-registry-auth",
				},
				true,
			),
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			director := createDirector(tc.target)
			director(tc.req)

			if diff := cmp.Diff(tc.req, tc.expectedReq, cmp.Comparer(compareRequests)); diff != "" {
				t.Fatalf("requests are different: \n%s", diff)
			}
		})
	}
}

func createURL(t *testing.T, urlString string) *url.URL {
	parsedURL, err := url.Parse(urlString)
	if err != nil {
		t.Fatalf("Failed to create url: %s", err)
	}

	return parsedURL
}

func createRequest(t *testing.T, method, url string, headers map[string]string, canonicalHeaders bool) *http.Request {
	req, err := http.NewRequest(method, url, nil)
	if err != nil {
		t.Fatalf("Failed to create http request: %s", err)
	} else {
		for k, v := range headers {
			if canonicalHeaders {
				req.Header.Add(k, v)
			} else {
				req.Header[k] = []string{v}
			}
		}
	}

	return req
}

func compareRequests(a, b *http.Request) bool {
	methodEqual := a.Method == b.Method
	urlEqual := cmp.Diff(a.URL, b.URL) == ""
	hostEqual := a.Host == b.Host
	protoEqual := a.Proto == b.Proto && a.ProtoMajor == b.ProtoMajor && a.ProtoMinor == b.ProtoMinor
	headersEqual := cmp.Diff(a.Header, b.Header) == ""

	return methodEqual && urlEqual && hostEqual && protoEqual && headersEqual
}
