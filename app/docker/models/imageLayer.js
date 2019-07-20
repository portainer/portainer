export function ImageLayerViewModel(order, data) {
  this.Order = order;
  this.Id = data.Id;
  this.Created = data.Created;
  this.CreatedBy = data.CreatedBy;
  this.Size = data.Size;
  this.Comment = data.Comment;
  this.Tags = data.Tags;
}
