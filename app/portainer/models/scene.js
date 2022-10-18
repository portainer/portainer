export function SceneDefaultModel() {
  this.Name = '';
  this.Description = '';
}

export function SceneModel(data) {
  this.Name = data.Name;
  this.Description = data.Description;
}
