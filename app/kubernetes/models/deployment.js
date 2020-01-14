export default function KubernetesDeploymentModelFromApplication(applicationFormValues) {
  this.Namespace = applicationFormValues.ResourcePool.Namespace.Name;
  this.Name = applicationFormValues.Name;
  this.StackName = applicationFormValues.StackName ? applicationFormValues.StackName : applicationFormValues.Name;
  this.ReplicaCount = applicationFormValues.ReplicaCount;
  this.Image = applicationFormValues.Image;
}