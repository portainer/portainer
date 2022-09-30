export function SceneDefaultModel() {
  this.Name = '';
  this.Description = '';
}

export function SceneModel(data) {
  this.Id = data.Id;
  this.Name = data.Name;
  this.Description = data.Description;
}

export function SceneUpdateRequest(model) {
  this.id = model.Id;
  this.Name = model.Name;
  this.Description = model.Description;
}
