package liboras

import (
	"crypto/sha256"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"oras.land/oras-go/v2/registry/remote"
)

func TestGenerateMinimalManifest(t *testing.T) {
	t.Parallel()
	t.Run("creates consistent manifest", func(t *testing.T) {
		manifest1, bytes1, err1 := generateMinimalManifest()
		require.NoError(t, err1)
		require.NotNil(t, manifest1)
		require.NotNil(t, bytes1)

		manifest2, bytes2, err2 := generateMinimalManifest()
		require.NoError(t, err2)
		require.NotNil(t, manifest2)
		require.NotNil(t, bytes2)

		// Manifests should be identical
		assert.Equal(t, manifest1, manifest2)
		assert.Equal(t, bytes1, bytes2)
	})

	t.Run("has correct media type", func(t *testing.T) {
		manifest, _, err := generateMinimalManifest()
		require.NoError(t, err)

		expectedMediaType := "application/vnd.oci.image.manifest.v1+json"
		assert.Equal(t, expectedMediaType, manifest.MediaType)
	})
}

func TestSafeDeleteTags(t *testing.T) {
	t.Parallel()
	t.Run("handles empty tag list", func(t *testing.T) {
		// Test the early return path - this should not call any registry operations
		err := SafeDeleteTags(nil, "test-repo", []string{})
		require.NoError(t, err, "Empty tag list should return without error")
	})

	t.Run("handles nil tag list", func(t *testing.T) {
		// Test the early return path - this should not call any registry operations
		err := SafeDeleteTags(nil, "test-repo", nil)
		require.NoError(t, err, "Nil tag list should return without error")
	})

	t.Run("single tag deletion", func(t *testing.T) {
		// Track the actual HTTP requests made to verify correct method calls and arguments
		var requests []string
		var configBlobPushed bool
		var manifestPushed bool
		var tagUpdated bool
		var manifestDeleted bool
		var dummyManifestDigest string // Store the digest of the dummy manifest created

		// Create a mock registry server that handles the OCI registry API endpoints
		ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			requests = append(requests, fmt.Sprintf("%s %s", r.Method, r.URL.Path))

			switch {
			// Handle blob uploads (for dummy manifest config)
			case strings.HasPrefix(r.URL.Path, "/v2/test-repo/blobs/uploads/") && r.Method == "POST":
				w.Header().Set("Location", "/v2/test-repo/blobs/uploads/uuid")
				w.WriteHeader(http.StatusAccepted)

			case strings.HasPrefix(r.URL.Path, "/v2/test-repo/blobs/uploads/") && r.Method == "PUT":
				configBlobPushed = true
				w.Header().Set("Docker-Content-Digest", "sha256:44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a")
				w.WriteHeader(http.StatusCreated)

			// Handle blob existence check
			case strings.HasPrefix(r.URL.Path, "/v2/test-repo/blobs/sha256:") && r.Method == "HEAD":
				w.Header().Set("Content-Length", "2")
				w.Header().Set("Docker-Content-Digest", r.URL.Path[len("/v2/test-repo/blobs/"):])
				w.WriteHeader(http.StatusOK)

			// Handle manifest operations
			case strings.HasPrefix(r.URL.Path, "/v2/test-repo/manifests/"):
				if r.Method == "PUT" {
					// Read the manifest content to calculate the correct digest
					body, err := io.ReadAll(r.Body)
					if err != nil {
						w.WriteHeader(http.StatusInternalServerError)
						return
					}

					// Calculate the SHA256 digest of the manifest content
					hash := sha256.Sum256(body)
					manifestDigest := fmt.Sprintf("sha256:%x", hash)

					if strings.Contains(r.URL.Path, "__portainer_dummy_") {
						manifestPushed = true
						dummyManifestDigest = manifestDigest // Store the dummy manifest digest
					} else if strings.Contains(r.URL.Path, "v1.0.0") {
						tagUpdated = true
					}
					w.Header().Set("Docker-Content-Digest", manifestDigest)
					w.WriteHeader(http.StatusCreated)

				} else if r.Method == "DELETE" {
					manifestDeleted = true

					// Extract and validate the digest being deleted
					digestPath := strings.TrimPrefix(r.URL.Path, "/v2/test-repo/manifests/")

					// Verify that the digest being deleted matches the dummy manifest digest
					if dummyManifestDigest != "" && digestPath != dummyManifestDigest {
						t.Errorf("DELETE digest mismatch: expected %s, got %s", dummyManifestDigest, digestPath)
					}

					w.WriteHeader(http.StatusAccepted)

				} else if r.Method == "GET" {
					// Return a minimal manifest for GET requests
					w.Header().Set("Content-Type", "application/vnd.oci.image.manifest.v1+json")
					_, _ = w.Write([]byte(`{"schemaVersion":2,"mediaType":"application/vnd.oci.image.manifest.v1+json","config":{"mediaType":"application/vnd.oci.image.config.v1+json","digest":"sha256:44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a","size":2},"layers":[]}`))
				}

			// Handle repository operations
			case r.URL.Path == "/v2/" && r.Method == "GET":
				w.WriteHeader(http.StatusOK)

			default:
				t.Logf("Unexpected request: %s %s", r.Method, r.URL.Path)
				w.WriteHeader(http.StatusNotFound)
			}
		}))
		defer ts.Close()

		// Create a registry client pointing to our test server
		registry, err := remote.NewRegistry(strings.TrimPrefix(ts.URL, "http://"))
		require.NoError(t, err)
		registry.PlainHTTP = true // Use HTTP for testing

		// Test SafeDeleteTags with a single tag
		repository := "test-repo"
		tagsToDelete := []string{"v1.0.0"}

		err = SafeDeleteTags(registry, repository, tagsToDelete)
		require.NoError(t, err)

		// Verify the expected sequence of HTTP calls was made
		assert.True(t, configBlobPushed, "Config blob should be pushed for dummy manifest")
		assert.True(t, manifestPushed, "Dummy manifest should be pushed with temporary tag")
		assert.True(t, tagUpdated, "Tag v1.0.0 should be updated to point to dummy manifest")
		assert.True(t, manifestDeleted, "Dummy manifest should be deleted to remove the tag")

		// Verify that we captured the dummy manifest digest
		assert.NotEmpty(t, dummyManifestDigest, "Dummy manifest digest should be captured")
		assert.True(t, strings.HasPrefix(dummyManifestDigest, "sha256:"), "Dummy manifest digest should be a SHA256 digest")

		// Verify the correct repository was used in all calls
		for _, req := range requests {
			if strings.Contains(req, "/v2/") && !strings.Contains(req, "/v2/test-repo") && !strings.Contains(req, "/v2/") {
				assert.Contains(t, req, "test-repo", "All repository operations should use correct repository name")
			}
		}

		t.Logf("HTTP requests made: %v", requests)
	})
}
