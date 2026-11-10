package libkubectl

import (
	"errors"
	"fmt"
	"os"
	"strings"

	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	utilyaml "k8s.io/apimachinery/pkg/util/yaml"
	"sigs.k8s.io/kustomize/kyaml/openapi"
	"sigs.k8s.io/kustomize/kyaml/yaml"
)

// PrepareObjects reads manifests and resolves the namespace of every namespaced object the way
// ApplyDynamic does, without contacting a cluster.
func PrepareObjects(manifests []string, namespace string) ([]*unstructured.Unstructured, error) {
	objects, err := readManifestObjects(manifests)
	if err != nil {
		return nil, err
	}

	if len(objects) == 0 {
		return nil, errors.New("no Kubernetes objects found in the manifests")
	}

	for _, object := range objects {
		if IsClusterScoped(object) {
			continue
		}

		resolved, err := resolveNamespace(namespace, object.GetNamespace())
		if err != nil {
			return nil, fmt.Errorf("namespace conflict for %s %q: %w", object.GetKind(), object.GetName(), err)
		}

		object.SetNamespace(resolved)
	}

	return objects, nil
}

// IsClusterScoped reports whether a resource lives outside any namespace. The answer comes from
// Kustomize's built-in schema rather than from the cluster, and a kind the schema does not know is
// treated as namespaced.
func IsClusterScoped(object *unstructured.Unstructured) bool {
	return openapi.IsCertainlyClusterScoped(yaml.TypeMeta{
		APIVersion: object.GetAPIVersion(),
		Kind:       object.GetKind(),
	})
}

func readManifestObjects(manifests []string) ([]*unstructured.Unstructured, error) {
	objects := make([]*unstructured.Unstructured, 0)

	for _, manifest := range manifests {
		manifest = strings.TrimSpace(manifest)
		if manifest == "" {
			continue
		}

		content := manifest
		if isManifestFile(manifest) {
			data, err := os.ReadFile(manifest)
			if err != nil {
				return nil, fmt.Errorf("failed to read manifest file %s: %w", manifest, err)
			}

			content = string(data)
		}

		documents, err := splitManifestDocuments(content)
		if err != nil {
			return nil, err
		}

		for _, document := range documents {
			object := &unstructured.Unstructured{}
			if err := utilyaml.NewYAMLOrJSONDecoder(strings.NewReader(document), len(document)).Decode(object); err != nil {
				return nil, fmt.Errorf("failed to decode YAML: %w", err)
			}

			if object.Object == nil {
				continue
			}

			if !object.IsList() {
				objects = append(objects, object)
				continue
			}

			if err := object.EachListItem(func(item runtime.Object) error {
				listItem, ok := item.(*unstructured.Unstructured)
				if !ok {
					return fmt.Errorf("unexpected list item type %T", item)
				}

				objects = append(objects, listItem)

				return nil
			}); err != nil {
				return nil, fmt.Errorf("failed to read list items: %w", err)
			}
		}
	}

	return objects, nil
}
