package factory

import (
	"net/http"
	"net/http/httptest"
	"net/http/httputil"
	"net/url"
	"testing"

	portainer "github.com/portainer/portainer/api"

	"github.com/google/go-cmp/cmp"
	"github.com/stretchr/testify/require"
)

func Test_createRewriteFn(t *testing.T) {
	t.Parallel()
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
					"Authorization":                     "secret",
					"Proxy-Authorization":               "secret",
					"Cookie":                            "secret",
					"X-Csrf-Token":                      "secret",
					"X-Api-Key":                         "secret",
					"Accept":                            "application/json",
					"Accept-Encoding":                   "gzip",
					"Accept-Language":                   "en-GB",
					"Cache-Control":                     "None",
					"Content-Length":                    "100",
					"Content-Type":                      "application/json",
					"Private-Token":                     "test-private-token",
					"User-Agent":                        "test-user-agent",
					"X-Portaineragent-Target":           "test-agent-1",
					"X-Portaineragent-Manageroperation": "1",
					"X-Portainer-Volumename":            "test-volume-1",
					"X-Registry-Auth":                   "test-registry-auth",
				},
				true,
			),
			expectedReq: createRequest(
				t,
				"GET",
				"https://portainer.io/api/docker/test?a=5&b=6&c=7",
				map[string]string{
					"Accept":                            "application/json",
					"Accept-Encoding":                   "gzip",
					"Accept-Language":                   "en-GB",
					"Cache-Control":                     "None",
					"Content-Length":                    "100",
					"Content-Type":                      "application/json",
					"Private-Token":                     "test-private-token",
					"User-Agent":                        "test-user-agent",
					"X-Portaineragent-Target":           "test-agent-1",
					"X-Portaineragent-Manageroperation": "1",
					"X-Portainer-Volumename":            "test-volume-1",
					"X-Registry-Auth":                   "test-registry-auth",
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
			rewriteFn := createRewriteFn(tc.target)
			proxyRequest := httputil.ProxyRequest{
				In:  tc.req.Clone(t.Context()),
				Out: tc.req.Clone(t.Context()),
			}
			rewriteFn(&proxyRequest)

			if diff := cmp.Diff(proxyRequest.In, tc.req, cmp.Comparer(compareRequests)); diff != "" {
				t.Fatalf("rewriteFn modified in request: \n%s", diff)
			}

			if diff := cmp.Diff(proxyRequest.Out, tc.expectedReq, cmp.Comparer(compareRequests)); diff != "" {
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

func Test_createRewriteFn_staleRawPath(t *testing.T) {
	t.Parallel()

	var receivedURI string
	backend := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		receivedURI = r.RequestURI
		w.WriteHeader(http.StatusOK)
	}))
	defer backend.Close()

	target, err := url.Parse(backend.URL)
	require.NoError(t, err)

	proxy := &httputil.ReverseProxy{Rewrite: createRewriteFn(target)}
	frontend := httptest.NewServer(proxy)
	defer frontend.Close()

	resp, err := http.Get(frontend.URL + "/%63ontainers/json")
	require.NoError(t, err)
	require.NoError(t, resp.Body.Close())

	require.Equal(t, "/containers/json", receivedURI)
}
