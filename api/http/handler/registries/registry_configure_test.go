package registries

import (
	"bytes"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"
)

// helper to build a multipart request for registry configure validation
func newConfigureRequest(t *testing.T, tls bool, skipVerify bool, includeCert bool, includeKey bool, includeCA bool) *http.Request {
	t.Helper()

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	// flags
	_ = writer.WriteField("TLS", map[bool]string{true: "true", false: "false"}[tls])
	_ = writer.WriteField("TLSSkipVerify", map[bool]string{true: "true", false: "false"}[skipVerify])

	// files
	if includeCert {
		fw, err := writer.CreateFormFile("TLSCertFile", "cert.pem")
		if err != nil {
			t.Fatalf("failed to create cert file: %v", err)
		}
		_, _ = fw.Write([]byte("CERTDATA"))
	}
	if includeKey {
		fw, err := writer.CreateFormFile("TLSKeyFile", "key.pem")
		if err != nil {
			t.Fatalf("failed to create key file: %v", err)
		}
		_, _ = fw.Write([]byte("KEYDATA"))
	}
	if includeCA {
		fw, err := writer.CreateFormFile("TLSCACertFile", "ca.pem")
		if err != nil {
			t.Fatalf("failed to create ca file: %v", err)
		}
		_, _ = fw.Write([]byte("CADATA"))
	}

	_ = writer.Close()

	req := httptest.NewRequest(http.MethodPost, "/registries/1/configure", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	return req
}

func Test_registryConfigurePayload_Validate_TLSBundleRules(t *testing.T) {
	// passes when all three are uploaded
	{
		req := newConfigureRequest(t, true, false, true, true, true)
		p := &registryConfigurePayload{}
		if err := p.Validate(req); err != nil {
			t.Fatalf("expected validation to pass when all certs provided, got error: %v", err)
		}
		if len(p.TLSCertFile) == 0 || len(p.TLSKeyFile) == 0 || len(p.TLSCACertFile) == 0 {
			t.Fatalf("expected payload to contain all cert bytes")
		}
	}

	// passes when none are uploaded
	{
		req := newConfigureRequest(t, true, false, false, false, false)
		p := &registryConfigurePayload{}
		if err := p.Validate(req); err != nil {
			t.Fatalf("expected validation to pass when no certs provided, got error: %v", err)
		}
		if len(p.TLSCertFile) != 0 || len(p.TLSKeyFile) != 0 || len(p.TLSCACertFile) != 0 {
			t.Fatalf("expected payload to have no cert bytes when none provided")
		}
	}

	// fails on partial uploads (1 or 2 of the files)
	partialCases := []struct {
		name string
		cert bool
		key  bool
		ca   bool
	}{
		{"only-cert", true, false, false},
		{"only-key", false, true, false},
		{"only-ca", false, false, true},
		{"cert-and-key", true, true, false},
		{"cert-and-ca", true, false, true},
		{"key-and-ca", false, true, true},
	}

	for _, tc := range partialCases {
		t.Run(tc.name, func(t *testing.T) {
			req := newConfigureRequest(t, true, false, tc.cert, tc.key, tc.ca)
			p := &registryConfigurePayload{}
			if err := p.Validate(req); err == nil {
				t.Fatalf("expected validation to fail on partial cert upload")
			}
		})
	}
}
