// TODO: review @LP
// As for deployments, I've created a function that creates a model for DaemonSet object from the ApplicationFormValues
// model defined in model/application.js
import _ from 'lodash-es';

export default function KubernetesDaemonSetModelFromApplication(applicationFormValues) {
  this.Namespace = applicationFormValues.ResourcePool.Namespace.Name;
  this.Name = applicationFormValues.Name;
  this.StackName = applicationFormValues.StackName ? applicationFormValues.StackName : applicationFormValues.Name;
  this.Image = applicationFormValues.Image;
  this.Env = [];

  // TODO: Secret environment variables are not supported yet
  _.forEach(applicationFormValues.EnvironmentVariables, (item) => {
    const envVar = {
      name: item.Name,
      value: item.Value
    };

    this.Env.push(envVar);
  });
}