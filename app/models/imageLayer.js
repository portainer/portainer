function ImageLayerViewModel(data) {
  this.Id = data.Id;
  this.Created = data.Created;
  this.CreatedBy = data.CreatedBy.replace("/bin/sh -c #(nop) ","").replace("/bin/sh -c ", "RUN ");
  this.Size = data.Size;
  this.Comment = data.Comment;
  this.Tags = data.Tags;
}
