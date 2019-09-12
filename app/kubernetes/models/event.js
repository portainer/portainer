export default function KubernetesEventViewModel(data) {
  this.Id = data.metadata.uid;
  this.Date = data.lastTimestamp;
  this.Type = data.type;
  this.Message = data.message;
  this.Involved = data.involvedObject;
}
