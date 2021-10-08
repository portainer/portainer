package kubernetes

import (
	"bytes"
	"fmt"
	"io"
	"strconv"
	"strings"

	"github.com/pkg/errors"
	"gopkg.in/yaml.v3"
)

const (
	labelPortainerAppStack   = "io.portainer.kubernetes.application.stack"
	labelPortainerAppStackID = "io.portainer.kubernetes.application.stackid"
	labelPortainerAppName    = "io.portainer.kubernetes.application.name"
	labelPortainerAppOwner   = "io.portainer.kubernetes.application.owner"
	labelPortainerAppKind    = "io.portainer.kubernetes.application.kind"
)

// KubeAppLabels are labels applied to all resources deployed in a kubernetes stack
type KubeAppLabels struct {
	StackID   int
	StackName string
	Owner     string
	Kind      string
}

// ToMap converts KubeAppLabels to a map[string]string
func (kal *KubeAppLabels) ToMap() map[string]string {
	return map[string]string{
		labelPortainerAppStackID: strconv.Itoa(kal.StackID),
		labelPortainerAppStack:   kal.StackName,
		labelPortainerAppName:    kal.StackName,
		labelPortainerAppOwner:   kal.Owner,
		labelPortainerAppKind:    kal.Kind,
	}
}

// GetHelmAppLabels returns the labels to be applied to portainer deployed helm applications
func GetHelmAppLabels(name, owner string) map[string]string {
	return map[string]string{
		labelPortainerAppName:  name,
		labelPortainerAppOwner: owner,
	}
}

// AddAppLabels adds required labels to "Resource"->metadata->labels.
// It'll add those labels to all Resource (nodes with a kind property exluding a list) it can find in provided yaml.
// Items in the yaml file could either be organised as a list or broken into multi documents.
func AddAppLabels(manifestYaml []byte, appLabels map[string]string) ([]byte, error) {
	if bytes.Equal(manifestYaml, []byte("")) {
		return manifestYaml, nil
	}

	postProcessYaml := func(yamlDoc interface{}) error {
		addResourceLabels(yamlDoc, appLabels)
		return nil
	}

	docs, err := ExtractDocuments(manifestYaml, postProcessYaml)
	if err != nil {
		return nil, err
	}

	return bytes.Join(docs, []byte("---\n")), nil
}

// ExtractDocuments extracts all the documents from a yaml file
// Optionally post-process each document with a function, which can modify the document in place.
// Pass in nil for postProcessYaml to skip post-processing.
func ExtractDocuments(manifestYaml []byte, postProcessYaml func(interface{}) error) ([][]byte, error) {
	docs := make([][]byte, 0)
	yamlDecoder := yaml.NewDecoder(bytes.NewReader(manifestYaml))

	for {
		m := make(map[string]interface{})
		err := yamlDecoder.Decode(&m)

		// if decoded document is empty
		if m == nil {
			continue
		}

		// if there are no more documents in the file
		if errors.Is(err, io.EOF) {
			break
		}

		// optionally post-process yaml
		if postProcessYaml != nil {
			if err := postProcessYaml(m); err != nil {
				return nil, errors.Wrap(err, "failed to post process yaml document")
			}
		}

		var out bytes.Buffer
		yamlEncoder := yaml.NewEncoder(&out)
		yamlEncoder.SetIndent(2)
		if err := yamlEncoder.Encode(m); err != nil {
			return nil, errors.Wrap(err, "failed to marshal yaml manifest")
		}

		docs = append(docs, out.Bytes())
	}

	return docs, nil
}

// GetNamespace returns the namespace of a kubernetes resource from its metadata
// It returns an empty string if namespace is not found in the resource
func GetNamespace(manifestYaml []byte) (string, error) {
	yamlDecoder := yaml.NewDecoder(bytes.NewReader(manifestYaml))
	m := make(map[string]interface{})
	err := yamlDecoder.Decode(&m)
	if err != nil {
		return "", errors.Wrap(err, "failed to unmarshal yaml manifest when obtaining namespace")
	}

	if _, ok := m["metadata"]; ok {
		if namespace, ok := m["metadata"].(map[string]interface{})["namespace"]; ok {
			return namespace.(string), nil
		}
	}

	return "", nil
}

func addResourceLabels(yamlDoc interface{}, appLabels map[string]string) {
	m, ok := yamlDoc.(map[string]interface{})
	if !ok {
		return
	}

	kind, ok := m["kind"]
	if ok && !strings.EqualFold(kind.(string), "list") {
		addLabels(m, appLabels)
		return
	}

	for _, v := range m {
		switch v.(type) {
		case map[string]interface{}:
			addResourceLabels(v, appLabels)
		case []interface{}:
			for _, item := range v.([]interface{}) {
				addResourceLabels(item, appLabels)
			}
		}
	}
}

func addLabels(obj map[string]interface{}, appLabels map[string]string) {
	metadata := make(map[string]interface{})
	if m, ok := obj["metadata"]; ok {
		metadata = m.(map[string]interface{})
	}

	labels := make(map[string]string)
	if l, ok := metadata["labels"]; ok {
		for k, v := range l.(map[string]interface{}) {
			labels[k] = fmt.Sprintf("%v", v)
		}
	}

	// merge app labels with existing labels
	for k, v := range appLabels {
		labels[k] = v
	}

	metadata["labels"] = labels
	obj["metadata"] = metadata
}
