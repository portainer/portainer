package libkubectl

import (
	"os"
	"runtime"
	"testing"

	"github.com/portainer/portainer/api/filesystem"
)

// BenchmarkApply tests require a Kubernetes cluster.
// BenchmarkApply measures the performance and memory allocation of the Apply function
func BenchmarkApply(b *testing.B) {
	kubeconfig := skipIfNoKubeconfig(b)

	client, err := NewClient(&ClientAccess{}, "default", kubeconfig, false)
	if err != nil {
		b.Fatalf("Failed to create client: %v", err)
	}

	// Apply expects file paths, so create a temp file
	tmpDir := b.TempDir()
	manifestFile := filesystem.JoinPaths(tmpDir, "manifest.yaml")
	manifestContent := `apiVersion: v1
kind: ConfigMap
metadata:
  name: benchmark-test-config
  namespace: default
data:
  key: value`

	if err := os.WriteFile(manifestFile, []byte(manifestContent), 0644); err != nil {
		b.Fatalf("Failed to create manifest file: %v", err)
	}

	manifests := []string{manifestFile}

	// Force GC and measure memory before benchmark
	runtime.GC()
	var memBefore runtime.MemStats
	runtime.ReadMemStats(&memBefore)

	for b.Loop() {
		_, err := client.Apply(b.Context(), manifests)
		if err != nil {
			b.Errorf("Failed to apply manifests: %v", err)
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

// BenchmarkApplyDynamic tests require a Kubernetes cluster.
// BenchmarkApplyDynamic measures the performance and memory allocation of the ApplyDynamic function
func BenchmarkApplyDynamic(b *testing.B) {
	kubeconfig := skipIfNoKubeconfig(b)
	client, err := NewClient(&ClientAccess{}, "default", kubeconfig, false)
	if err != nil {
		b.Fatalf("Failed to create client: %v", err)
	}

	manifests := []string{
		`apiVersion: v1
kind: ConfigMap
metadata:
  name: benchmark-test-config
  namespace: default
data:
  key: value`,
	}

	ctx := b.Context()

	// Force GC and measure memory before benchmark
	runtime.GC()
	var memBefore runtime.MemStats
	runtime.ReadMemStats(&memBefore)

	for b.Loop() {
		_, err := client.ApplyDynamic(ctx, manifests)
		if err != nil {
			b.Errorf("Failed to apply dynamic manifests: %v", err)
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
