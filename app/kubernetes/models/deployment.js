import _ from 'lodash-es';
import KubernetesSecretModel from 'Kubernetes/models/secret';

function bytesValue(mem) {
  return mem * 1000 * 1000;
}

export default function KubernetesDeploymentModelFromApplication(applicationFormValues) {
  this.Namespace = applicationFormValues.ResourcePool.Namespace.Name;
  this.Name = applicationFormValues.Name;
  this.StackName = applicationFormValues.StackName ? applicationFormValues.StackName : applicationFormValues.Name;
  this.ReplicaCount = applicationFormValues.ReplicaCount;
  this.Image = applicationFormValues.Image;
  this.Env = [];
  this.CpuLimit = applicationFormValues.CpuLimit;
  this.MemoryLimit = bytesValue(applicationFormValues.MemoryLimit);

  // TODO: review on architecture/refactor meeting
  // Secret management is the same in here and daemonset.js
  // It implies the creation of another model object and set the model.Data directly in
  // the loop below. Not sure if an helper function or a function related to the model should be used
  // to append data to a secret instead.
  // Also we always associate a secret object to this deployment object even if there is no secret env vars.
  // We have to check if there is any data in the secret on deployment creation to determine if we want to create a
  // secret first. See createAsync in KubernetesApplicationService.
  this.Secret = new KubernetesSecretModel(this.Name, this.Namespace, this.StackName);

  _.forEach(applicationFormValues.EnvironmentVariables, (item) => {
    let envVar = {
      name: item.Name
    };

    if (item.IsSecret) {
      envVar.valueFrom = {
        secretKeyRef: {
          name: this.Name,
            key: item.Name
        }
      };

      this.Secret.Data[item.Name] = btoa(unescape(encodeURIComponent(item.Value)));
    } else {
      envVar.value = item.Value
    }

    this.Env.push(envVar);
  });
}