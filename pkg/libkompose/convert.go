package libkompose

import (
	"errors"
	"fmt"

	"github.com/kubernetes/kompose/pkg/app"
	"github.com/kubernetes/kompose/pkg/kobject"
	"k8s.io/apimachinery/pkg/runtime"
)

var (
	validProviders   = map[string]bool{"kubernetes": true, "openshift": true}
	validControllers = map[string]bool{"": true, "deployment": true, "daemonSet": true, "replicationController": true, "deploymentConfig": true}
	validVolumes     = map[string]bool{"persistentVolumeClaim": true, "emptyDir": true, "hostPath": true, "configMap": true}
)

// ConvertComposeFiles converts one or more Docker Compose files to Kubernetes manifests or Helm charts.
// It uses sensible defaults for all options and returns the generated Kubernetes objects.
func ConvertComposeFiles(composeFiles []string, opts *ConvertOptions) ([]runtime.Object, error) {
	if len(composeFiles) == 0 {
		return nil, errors.New("at least one compose file is required")
	}

	convertOpts, err := getDefaultConvertOptions(opts)
	if err != nil {
		return nil, fmt.Errorf("failed to get default convert options: %w", err)
	}
	convertOpts.InputFiles = composeFiles

	if err := app.ValidateComposeFile(convertOpts); err != nil {
		return nil, fmt.Errorf("failed to validate compose file: %w", err)
	}

	objects, err := app.Convert(*convertOpts)
	if err != nil {
		return nil, fmt.Errorf("failed to convert compose files: %w", err)
	}

	return objects, nil
}

func getDefaultConvertOptions(opts *ConvertOptions) (*kobject.ConvertOptions, error) {
	if opts == nil {
		opts = &ConvertOptions{}
	}

	provider := opts.Provider
	if provider == "" {
		provider = "kubernetes"
	} else if !validProviders[provider] {
		return nil, fmt.Errorf("invalid provider %q: must be one of: kubernetes, openshift", provider)
	}

	replicas := opts.Replicas
	if replicas == 0 {
		replicas = 1
	} else if replicas < 0 {
		return nil, fmt.Errorf("invalid replicas %d: must be a positive integer", replicas)
	}

	volumes := opts.Volumes
	if volumes == "" {
		volumes = "persistentVolumeClaim"
	} else if !validVolumes[volumes] {
		return nil, fmt.Errorf("invalid volumes %q: must be one of: persistentVolumeClaim, emptyDir, hostPath, configMap", volumes)
	}

	yamlIndent := opts.YAMLIndent
	if yamlIndent == 0 {
		yamlIndent = 2
	} else if yamlIndent < 0 {
		return nil, fmt.Errorf("invalid yamlIndent %d: must be a positive integer", yamlIndent)
	}

	if !validControllers[opts.Controller] {
		return nil, fmt.Errorf("invalid controller %q: must be one of: deployment, daemonSet, replicationController, deploymentConfig", opts.Controller)
	}

	if opts.ToStdout && opts.CreateChart {
		return nil, errors.New("cannot use ToStdout with CreateChart")
	}
	if opts.ToStdout && opts.OutFile != "" {
		return nil, errors.New("cannot use ToStdout with OutFile")
	}

	return &kobject.ConvertOptions{
		OutFile:                 opts.OutFile,
		CreateChart:             opts.CreateChart,
		GenerateYaml:            true,
		GenerateJSON:            false,
		ToStdout:                opts.ToStdout,
		Namespace:               opts.Namespace,
		Provider:                provider,
		Controller:              opts.Controller,
		Replicas:                replicas,
		Volumes:                 volumes,
		PVCRequestSize:          opts.PVCRequestSize,
		GenerateNetworkPolicies: opts.GenerateNetworkPolicies,
		YAMLIndent:              yamlIndent,
		Build:                   "none",
		WithKomposeAnnotation:   false,
		NoInterpolate:           false,
		EmptyVols:               false,
		InsecureRepository:      false,
		PushImage:               false,
		MultipleContainerMode:   false,
		SecretsAsFiles:          false,
		StoreManifest:           false,
	}, nil
}
