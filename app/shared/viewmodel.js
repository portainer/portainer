function ImageViewModel(data) {
    this.Id = data.Id;
    this.Tag = data.Tag;
    this.Repository = data.Repository;
    this.Created = data.Created;
    this.Checked = false;
    this.RepoTags = data.RepoTags;
    this.VirtualSize = data.VirtualSize;
}

function ContainerViewModel(data) {
    this.Id = data.Id;
    this.State = data.State;
    this.Names = data.Names;
    this.IP = data.NetworkSettings.Networks[Object.keys(data.NetworkSettings.Networks)[0]].IPAddress;
    this.Image = data.Image;
    this.Command = data.Command;
    this.Checked = false;
}
