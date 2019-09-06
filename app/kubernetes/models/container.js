export default function KubernetesContainerViewModel(data, status) {
  this.Name = data.name;
  this.Ready = status.ready;
  if (status.state.running) {
    this.Status = 'Running';
  } else if (status.state.terminated) {
    this.Status = 'Terminated';
  } else if (status.state.waiting) {
    this.Status = 'Waiting';
  } else {
    this.Status = 'Unknown';
  }
}
