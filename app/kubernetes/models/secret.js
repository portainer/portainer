import _ from 'lodash-es';

export function KubernetesSecretViewModel(data) {
  this.Id = data.metadata.uid;
  this.Name = data.metadata.name;
  this.Namespace = data.metadata.namespace;
  this.Type = data.type;
  this.CreatedAt = data.metadata.creationTimestamp;
}

function KubernetesSecretDataViewModel(key, value) {
  this.Key = key;
  this.Value = value;
  this.Size = _.size(value);
}

export function KubernetesSecretDetailsViewModel(data, yaml) {
  Object.assign(this, new KubernetesSecretViewModel(data));
  this.Labels = data.metadata.labels;
  this.Data = _.map(data.data, (value, key) => new KubernetesSecretDataViewModel(key, value));
  this.Yaml = yaml;
}
