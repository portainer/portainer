package libkubectl

import (
	"bufio"
	"errors"
	"fmt"
	"io"
	"strings"

	utilyaml "k8s.io/apimachinery/pkg/util/yaml"
)

// splitManifestDocuments returns the non-empty YAML documents of a manifest.
// It reads the manifest the way kubectl does, so a "---" separator carrying
// trailing whitespace, a trailing comment, or CRLF line endings still separates
// the documents that follow it instead of hiding them in the preceding one.
func splitManifestDocuments(manifest string) ([]string, error) {
	reader := utilyaml.NewYAMLReader(bufio.NewReader(strings.NewReader(manifest)))

	documents := []string{}
	for {
		document, err := reader.Read()
		if errors.Is(err, io.EOF) {
			return documents, nil
		}
		if err != nil {
			return nil, fmt.Errorf("failed to split the manifest into documents: %w", err)
		}

		if trimmed := strings.TrimSpace(string(document)); trimmed != "" {
			documents = append(documents, trimmed)
		}
	}
}

func isManifestFile(resource string) bool {
	trimmedResource := strings.TrimSpace(resource)
	return strings.HasSuffix(trimmedResource, ".yaml") || strings.HasSuffix(trimmedResource, ".yml")
}

func resourcesToArgs(resources []string) []string {
	args := []string{}
	for _, resource := range resources {
		if isManifestFile(resource) {
			args = append(args, "-f", strings.TrimSpace(resource))
		} else {
			args = append(args, resource)
		}
	}
	return args
}
