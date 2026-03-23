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
	"k8s.io/apimachinery/pkg/util/yaml"
	"k8s.io/client-go/discovery"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/restmapper"
)

// DeleteDynamic deletes Kubernetes resources using the dynamic client.
// This is the counterpart to ApplyDynamic and can delete resources from inline YAML manifests.
func (c *Client) DeleteDynamic(ctx context.Context, manifests []string) (string, error) {
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

	var results []string
	var errs error

	// Process each manifest
	for _, manifest := range manifests {
		manifest = strings.TrimSpace(manifest)
		if manifest == "" {
			continue
		}

		var content string
		if isManifestFile(manifest) {
			data, err := os.ReadFile(manifest)
			if err != nil {
				errs = errors.Join(errs, fmt.Errorf("failed to read file %s: %w", manifest, err))
				continue
			}
			content = string(data)
		} else {
			content = manifest
		}

		// Split by document separator if multiple resources in one manifest
		for resource := range strings.SplitSeq(content, "\n---\n") {
			resource = strings.TrimSpace(resource)
			if resource == "" {
				continue
			}

			result, err := c.deleteResource(ctx, dynamicClient, mapper, []byte(resource))
			if err != nil {
				errs = errors.Join(errs, err)
				continue
			}
			results = append(results, result)
		}
	}

	// Build output message
	output := strings.Join(results, "\n")

	if errs != nil {
		if len(results) == 0 {
			return "", fmt.Errorf("failed to delete resources: %s", errs.Error())
		}
		return output, fmt.Errorf("partially deleted resources with errors: %s", errs.Error())
	}

	return output, nil
}

// deleteResource deletes a single resource
func (c *Client) deleteResource(ctx context.Context, dynamicClient dynamic.Interface, mapper meta.RESTMapper, resourceYAML []byte) (string, error) {
	// Decode YAML to unstructured object
	obj := &unstructured.Unstructured{}
	decoder := yaml.NewYAMLOrJSONDecoder(strings.NewReader(string(resourceYAML)), 4096)
	if err := decoder.Decode(obj); err != nil {
		// Ignore decode errors for empty documents
		return "", nil
	}

	// Skip empty objects
	if obj.Object == nil {
		return "", nil
	}

	// Get GVK (GroupVersionKind) from the object
	gvk := obj.GroupVersionKind()
	if gvk.Empty() {
		return "", nil
	}

	// Map GVK to GVR (GroupVersionResource)
	mapping, err := mapper.RESTMapping(gvk.GroupKind(), gvk.Version)
	if err != nil {
		return "", fmt.Errorf("failed to map resource type %s: %w", gvk.String(), err)
	}

	// Get namespace (if applicable)
	namespace := obj.GetNamespace()
	name := obj.GetName()

	// Get the dynamic resource client
	var resourceClient dynamic.ResourceInterface
	if mapping.Scope.Name() == meta.RESTScopeNameNamespace {
		// Namespaced resource
		if namespace == "" {
			namespace = "default"
		}
		resourceClient = dynamicClient.Resource(mapping.Resource).Namespace(namespace)
	} else {
		// Cluster-scoped resource
		resourceClient = dynamicClient.Resource(mapping.Resource)
	}

	// Delete the resource
	// Use nil GracePeriodSeconds to respect the resource's default grace period (consistent with kubectl)
	deleteOptions := metav1.DeleteOptions{}

	err = resourceClient.Delete(ctx, name, deleteOptions)
	if err != nil {
		// Ignore not found errors (consistent with kubectl delete --ignore-not-found behavior)
		if apierrors.IsNotFound(err) {
			return fmt.Sprintf("%s/%s deleted (not found)", strings.ToLower(gvk.Kind), name), nil
		}
		return "", fmt.Errorf("failed to delete %s %s/%s: %w", gvk.Kind, namespace, name, err)
	}

	// Format output message (consistent with kubectl output format)
	resourceType := strings.ToLower(gvk.Kind)
	return fmt.Sprintf("%s/%s deleted", resourceType, name), nil
}
