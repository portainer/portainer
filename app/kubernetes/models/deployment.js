import _ from 'lodash-es';

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

  // TODO: Secret environment variables are not supported yet
  _.forEach(applicationFormValues.EnvironmentVariables, (item) => {
    const envVar = {
      name: item.Name,
      value: item.Value
    };

    this.Env.push(envVar);
  });
}