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
	labelPortainerAppStackID = "io.portainer.kubernetes.application.stackid"
	labelPortainerAppName    = "io.portainer.kubernetes.application.name"
	labelPortainerAppOwner   = "io.portainer.kubernetes.application.owner"
	labelPortainerAppKind    = "io.portainer.kubernetes.application.kind"
)

// KubeAppLabels are labels applied to all resources deployed in a kubernetes stack
type KubeAppLabels struct {
	StackID int
	Name    string
	Owner   string
	Kind    string
}

// ToMap converts KubeAppLabels to a map[string]string
func (kal *KubeAppLabels) ToMap() map[string]string {
	return map[string]string{
		labelPortainerAppStackID: strconv.Itoa(kal.StackID),
		labelPortainerAppName:    kal.Name,
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

		addResourceLabels(m, appLabels)

		var out bytes.Buffer
		yamlEncoder := yaml.NewEncoder(&out)
		yamlEncoder.SetIndent(2)
		if err := yamlEncoder.Encode(m); err != nil {
			return nil, errors.Wrap(err, "failed to marshal yaml manifest")
		}

		docs = append(docs, out.Bytes())
	}

	return bytes.Join(docs, []byte("---\n")), nil
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

	// fallback to metadata name if name label not explicitly provided
	if name, ok := labels[labelPortainerAppName]; !ok || name == "" {
		if n, ok := metadata["name"]; ok {
			labels[labelPortainerAppName] = n.(string)
		}
	}

	metadata["labels"] = labels
	obj["metadata"] = metadata
}
