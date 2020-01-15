export default function KubernetesSecretModel(name, namespace, stack) {
  this.Name = name;
  this.Namespace = namespace;
  this.StackName = stack;
  this.Type = 'Opaque';
  this.Data = {};
}

