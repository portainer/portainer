// TODO: review @LP
// As for deployments, I've created a function that creates a model for DaemonSet object from the ApplicationFormValues
// model defined in model/application.js
export default function KubernetesDaemonSetModelFromApplication(applicationFormValues) {
  this.Namespace = applicationFormValues.ResourcePool.Namespace.Name;
  this.Name = applicationFormValues.Name;
  this.StackName = applicationFormValues.StackName;
  this.Image = applicationFormValues.Image;
}