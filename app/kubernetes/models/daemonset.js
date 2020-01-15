// TODO: review on architecture/refactor meeting
// As for deployments, I've created a function that creates a model for DaemonSet object from the ApplicationFormValues
// model defined in model/application.js
// This is basically a "converter" function from the form values to a temporary model that can be used to create a payload
// Maybe convert directly to payload? As this model is only used to create payloads at the moment.
// If it is used elsewhere later then maybe rename it to clarify its purpose (not really a view model at the moment hence
// why it was not named KubernetesDaemonSetViewModelFromApplication).
import _ from 'lodash-es';
import KubernetesSecretModel from 'Kubernetes/models/secret';

function bytesValue(mem) {
  return mem * 1000 * 1000;
}

export default function KubernetesDaemonSetModelFromApplication(applicationFormValues) {
  this.Namespace = applicationFormValues.ResourcePool.Namespace.Name;
  this.Name = applicationFormValues.Name;
  this.StackName = applicationFormValues.StackName ? applicationFormValues.StackName : applicationFormValues.Name;
  this.Image = applicationFormValues.Image;
  this.Env = [];
  this.CpuLimit = applicationFormValues.CpuLimit;
  this.MemoryLimit = bytesValue(applicationFormValues.MemoryLimit);
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