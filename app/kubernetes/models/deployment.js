export default function KubernetesDeploymentModelFromApplication(applicationFormValues) {
  this.Namespace = applicationFormValues.ResourcePool.Namespace.Name;
  this.Name = applicationFormValues.Name;
  this.StackName = applicationFormValues.StackName;
  this.ReplicaCount = applicationFormValues.ReplicaCount;
  this.Image = applicationFormValues.Image;
}