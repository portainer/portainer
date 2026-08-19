export function WebhookViewModel(data) {
  this.Id = data.Id;
  this.Token = data.Token;
  this.ResourceId = data.ResourceID;
  this.EndpointId = data.EndpointID;
  this.WebhookType = data.WebhookType;
}
