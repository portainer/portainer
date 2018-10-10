export function ResourceGroupViewModel(data, subscriptionId) {
  this.Id = data.id;
  this.SubscriptionId = subscriptionId;
  this.Name = data.name;
  this.Location = data.location;
}
