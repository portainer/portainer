
function ImageViewModel(data) {
    this.Id = data.Id;
    this.Tag = data.Tag;
    this.Repository = data.Repository;
    this.Created = data.Created;
    this.Checked = false;
}

function ContainerViewModel(data) {
   this.Id = data.Id;
   this.Image = data.Image;
   this.Command = data.Command;
   this.Created = data.Created;
   this.SizeRw = data.SizeRw;
   this.Status = data.Status;
   this.Checked = false;
}
