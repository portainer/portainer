import _ from 'lodash-es';
import KubernetesSecretModel from 'Kubernetes/models/secret';
import {KubernetesApplicationVolumeName} from 'Kubernetes/models/application';

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

  this.VolumeMounts = [];
  this.Volumes = [];
  _.forEach(applicationFormValues.PersistedFolders, (item) => {
    const volumeMount = {
      mountPath: item.ContainerPath,
      name: KubernetesApplicationVolumeName(applicationFormValues.Name, item.ContainerPath)
    };

    this.VolumeMounts.push(volumeMount);

    const volume = {
      name: KubernetesApplicationVolumeName(applicationFormValues.Name, item.ContainerPath),
      persistentVolumeClaim: {
        claimName: KubernetesApplicationVolumeName(applicationFormValues.Name, item.ContainerPath)
      }
    };

    this.Volumes.push(volume);
  });
}