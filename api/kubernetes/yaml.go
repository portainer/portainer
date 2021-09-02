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

type KubeAppLabels struct {
	StackID int
	Name    string
	Owner   string
	Kind    string
}

// AddAppLabels adds required labels to "Resource"->metadata->labels.
// It'll add those labels to all Resource (nodes with a kind property exluding a list) it can find in provided yaml.
// Items in the yaml file could either be organised as a list or broken into multi documents.
func AddAppLabels(manifestYaml []byte, appLabels KubeAppLabels) ([]byte, error) {
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

func addResourceLabels(yamlDoc interface{}, appLabels KubeAppLabels) {
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

func addLabels(obj map[string]interface{}, appLabels KubeAppLabels) {
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

	name := appLabels.Name
	if appLabels.Name == "" {
		if n, ok := metadata["name"]; ok {
			name = n.(string)
		}
	}

	labels["io.portainer.kubernetes.application.stackid"] = strconv.Itoa(appLabels.StackID)
	labels["io.portainer.kubernetes.application.name"] = name
	labels["io.portainer.kubernetes.application.owner"] = appLabels.Owner
	labels["io.portainer.kubernetes.application.kind"] = appLabels.Kind

	metadata["labels"] = labels
	obj["metadata"] = metadata
}
