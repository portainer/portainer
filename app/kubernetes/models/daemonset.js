// TODO: review on architecture/refactor meeting
// As for deployments, I've created a function that creates a model for DaemonSet object from the ApplicationFormValues
// model defined in model/application.js
// This is basically a "converter" function from the form values to a temporary model that can be used to create a payload
// Maybe convert directly to payload? As this model is only used to create payloads at the moment.
// If it is used elsewhere later then maybe rename it to clarify its purpose (not really a view model at the moment hence
// why it was not named KubernetesDaemonSetViewModelFromApplication).
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