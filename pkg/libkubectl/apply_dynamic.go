package libkubectl

import (
	"context"
	"errors"
	"fmt"
	"os"
	"strings"

	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/meta"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/apimachinery/pkg/util/yaml"
	"k8s.io/client-go/discovery"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/restmapper"
)

// ApplyDynamic applies Kubernetes resources using the dynamic client with Server-Side Apply.
// This implementation is more performant than the kubectl library approach and provides
// better conflict resolution through Server-Side Apply (SSA).
func (c *Client) ApplyDynamic(ctx context.Context, manifests []string) (string, error) {
	// Create REST config from the factory
	restConfig, err := c.factory.ToRESTConfig()
	if err != nil {
		return "", fmt.Errorf("failed to create REST config: %w", err)
	}

	// Create dynamic client
	dynamicClient, err := dynamic.NewForConfig(restConfig)
	if err != nil {
		return "", fmt.Errorf("failed to create dynamic client: %w", err)
	}

	// Create discovery client for resource mapping
	discoveryClient, err := discovery.NewDiscoveryClientForConfig(restConfig)
	if err != nil {
		return "", fmt.Errorf("failed to create discovery client: %w", err)
	}

	// Create REST mapper
	groupResources, err := restmapper.GetAPIGroupResources(discoveryClient)
	if err != nil {
		return "", fmt.Errorf("failed to get API group resources: %w", err)
	}
	mapper := restmapper.NewDiscoveryRESTMapper(groupResources)

	// Get the namespace configured on the client (from form/API payload)
	// The second return value indicates if the namespace was explicitly set
	configuredNamespace, wasExplicitlySet, err := c.factory.ToRawKubeConfigLoader().Namespace()
	if err != nil {
		return "", fmt.Errorf("failed to get configured namespace: %w", err)
	}
	// Only treat as configured if it was explicitly set (not just defaulted from kubeconfig)
	if !wasExplicitlySet {
		configuredNamespace = ""
	}

	var results []string
	var processErr error

	// Process each manifest
	for _, manifest := range manifests {
		manifest = strings.TrimSpace(manifest)
		if manifest == "" {
			continue
		}

		var content string
		// Check if manifest is a file path
		if isManifestFile(manifest) {
			data, err := os.ReadFile(manifest)
			if err != nil {
				processErr = errors.Join(processErr, fmt.Errorf("failed to read file %s: %w", manifest, err))
				continue
			}
			content = string(data)
		} else {
			content = manifest
		}

		// Split by document separator if multiple resources in one manifest
		resources := strings.SplitSeq(content, "\n---\n")

		for resource := range resources {
			resource = strings.TrimSpace(resource)
			if resource == "" {
				continue
			}

			result, err := c.applyResource(ctx, dynamicClient, mapper, []byte(resource), configuredNamespace)
			if err != nil {
				processErr = errors.Join(processErr, fmt.Errorf("failed to apply resource: %w", err))
				continue
			}
			results = append(results, result)
		}
	}

	// Build output message
	output := strings.Join(results, "\n")

	if processErr != nil {
		if len(results) == 0 {
			return "", fmt.Errorf("failed to apply resources: %s", processErr.Error())
		}
		return output, fmt.Errorf("partially applied resources with errors: %s", processErr.Error())
	}

	return output, nil
}

// applyResource applies a single resource using Server-Side Apply.
// configuredNamespace is the namespace set via form/API (empty string means "use manifest namespace").
func (c *Client) applyResource(ctx context.Context, dynamicClient dynamic.Interface, mapper meta.RESTMapper, resourceYAML []byte, configuredNamespace string) (string, error) {
	obj := &unstructured.Unstructured{}
	decoder := yaml.NewYAMLOrJSONDecoder(strings.NewReader(string(resourceYAML)), 4096)
	if err := decoder.Decode(obj); err != nil {
		return "", fmt.Errorf("failed to decode YAML: %w", err)
	}

	// Skip empty objects
	if obj.Object == nil {
		return "", nil
	}

	// Get GVK (GroupVersionKind) from the object
	gvk := obj.GroupVersionKind()
	if gvk.Empty() {
		return "", errors.New("unable to determine resource type")
	}

	// Map GVK to GVR (GroupVersionResource)
	mapping, err := mapper.RESTMapping(gvk.GroupKind(), gvk.Version)
	if err != nil {
		return "", fmt.Errorf("failed to map resource type %s: %w", gvk.String(), err)
	}

	name := obj.GetName()

	// Get the dynamic resource client
	var resourceClient dynamic.ResourceInterface
	var namespace string

	if mapping.Scope.Name() == meta.RESTScopeNameNamespace {
		namespace, err = resolveNamespace(configuredNamespace, obj.GetNamespace())
		if err != nil {
			return "", fmt.Errorf("namespace conflict for %s %q: %w", gvk.Kind, name, err)
		}
		obj.SetNamespace(namespace)
		resourceClient = dynamicClient.Resource(mapping.Resource).Namespace(namespace)
	} else {
		resourceClient = dynamicClient.Resource(mapping.Resource)
	}

	// Convert object to JSON for Server-Side Apply
	data, err := obj.MarshalJSON()
	if err != nil {
		return "", fmt.Errorf("failed to marshal object to JSON: %w", err)
	}

	// Apply using Server-Side Apply (Patch). If the resource does not exist (404),
	// fall back to Create so restoration can create Deployments and other resources
	// that were removed (e.g. by Helm uninstall).
	patchOptions := metav1.PatchOptions{
		FieldManager: "portainer",
		Force:        boolPtr(true),
	}

	_, err = resourceClient.Patch(
		ctx,
		name,
		types.ApplyPatchType,
		data,
		patchOptions,
	)
	if err != nil {
		if apierrors.IsNotFound(err) {
			_, createErr := resourceClient.Create(ctx, obj, metav1.CreateOptions{})
			if createErr != nil {
				return "", fmt.Errorf("failed to create %s %s/%s: %w", gvk.Kind, namespace, name, createErr)
			}
		} else {
			return "", fmt.Errorf("failed to apply %s %s/%s: %w", gvk.Kind, namespace, name, err)
		}
	}

	// Format output message
	resourceType := strings.ToLower(gvk.Kind)
	return fmt.Sprintf("%s/%s configured", resourceType, name), nil
}

// resolveNamespace determines the namespace for a resource
func resolveNamespace(configuredNamespace, manifestNamespace string) (string, error) {
	// If both namespaces are set and don't match return an error (to match the behavior where the kubectl client (from the form/API) has a different namespace than the manifest)
	if configuredNamespace != "" && manifestNamespace != "" && configuredNamespace != manifestNamespace {
		return "", fmt.Errorf("the namespace %q from the manifest does not match the namespace %q set from the form/API", manifestNamespace, configuredNamespace)
	}
	if configuredNamespace != "" {
		return configuredNamespace, nil
	}
	if manifestNamespace != "" {
		return manifestNamespace, nil
	}
	return "default", nil
}

func boolPtr(b bool) *bool {
	return &b
}
