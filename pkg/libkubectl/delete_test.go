package libkubectl

import (
	"os"
	"runtime"
	"testing"

	"github.com/portainer/portainer/api/filesystem"
)

// BenchmarkDeleteDynamic tests require a Kubernetes cluster.
// BenchmarkDeleteDynamic measures the performance and memory allocation of the DeleteDynamic function.
// The resource is recreated before each delete (using StopTimer/StartTimer to exclude setup time),
// so all iterations measure actual delete performance, not "not found" handling.
func BenchmarkDeleteDynamic(b *testing.B) {
	kubeconfig := skipIfNoKubeconfig(b)
	client, err := NewClient(&ClientAccess{}, "default", kubeconfig, false)
	if err != nil {
		b.Fatalf("Failed to create client: %v", err)
	}

	manifests := []string{
		`apiVersion: v1
kind: ConfigMap
metadata:
  name: benchmark-delete-test-config
  namespace: default
data:
  key: value`,
	}

	// Apply the manifest once BEFORE the benchmark loop
	_, err = client.ApplyDynamic(b.Context(), manifests)
	if err != nil {
		b.Fatalf("Failed to apply initial manifest: %v", err)
	}

	// Force GC and measure memory before benchmark
	runtime.GC()
	var memBefore runtime.MemStats
	runtime.ReadMemStats(&memBefore)

	for b.Loop() {
		// Recreate the resource before each delete to ensure it always exists
		b.StopTimer()
		_, err = client.ApplyDynamic(b.Context(), manifests)
		if err != nil {
			b.Fatalf("Failed to apply manifest: %v", err)
		}
		b.StartTimer()

		// Delete the resource (always exists)
		_, err = client.DeleteDynamic(b.Context(), manifests)
		if err != nil {
			b.Errorf("Failed to delete dynamic manifests: %v", err)
		}
	}

	// Force GC and measure memory after benchmark
	runtime.GC()
	var memAfter runtime.MemStats
	runtime.ReadMemStats(&memAfter)

	// Report retained memory (key metric for leak detection)
	retained := int64(memAfter.Alloc) - int64(memBefore.Alloc)
	retainedMB := float64(retained) / 1024 / 1024
	b.ReportMetric(float64(retained), "B-retained")
	b.ReportMetric(retainedMB, "MB-retained")
}

// BenchmarkDelete tests require a Kubernetes cluster.
// BenchmarkDelete measures the performance and memory allocation of the Delete function.
// The resource is recreated before each delete (using StopTimer/StartTimer to exclude setup time),
// so all iterations measure actual delete performance, not "not found" handling.
func BenchmarkDelete(b *testing.B) {
	kubeconfig := skipIfNoKubeconfig(b)

	client, err := NewClient(&ClientAccess{}, "default", kubeconfig, false)
	if err != nil {
		b.Fatalf("Failed to create client: %v", err)
	}

	// Delete expects file paths, so create a temp file
	tmpDir := b.TempDir()
	manifestFile := filesystem.JoinPaths(tmpDir, "manifest.yaml")
	manifestContent := `apiVersion: v1
kind: ConfigMap
metadata:
  name: benchmark-delete-file-test-config
  namespace: default
data:
  key: value`

	if err := os.WriteFile(manifestFile, []byte(manifestContent), 0644); err != nil {
		b.Fatalf("Failed to create manifest file: %v", err)
	}

	manifests := []string{manifestFile}
	manifestsInline := []string{manifestContent}

	// Apply the manifest once BEFORE the benchmark loop using ApplyDynamic
	_, err = client.ApplyDynamic(b.Context(), manifestsInline)
	if err != nil {
		b.Fatalf("Failed to apply initial manifest: %v", err)
	}

	// Force GC and measure memory before benchmark
	runtime.GC()
	var memBefore runtime.MemStats
	runtime.ReadMemStats(&memBefore)

	for b.Loop() {
		// Recreate the resource before each delete to ensure it always exists
		b.StopTimer()
		_, err = client.ApplyDynamic(b.Context(), manifestsInline)
		if err != nil {
			b.Fatalf("Failed to apply manifest: %v", err)
		}
		b.StartTimer()

		// Delete the resource using Delete (file-based, always exists)
		_, err = client.Delete(b.Context(), manifests)
		if err != nil {
			b.Errorf("Failed to delete manifests: %v", err)
		}
	}

	// Force GC and measure memory after benchmark
	runtime.GC()
	var memAfter runtime.MemStats
	runtime.ReadMemStats(&memAfter)

	// Report retained memory (key metric for leak detection)
	retained := int64(memAfter.Alloc) - int64(memBefore.Alloc)
	retainedMB := float64(retained) / 1024 / 1024
	b.ReportMetric(float64(retained), "B-retained")
	b.ReportMetric(retainedMB, "MB-retained")
}
