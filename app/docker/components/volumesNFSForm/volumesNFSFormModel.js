function VolumesNFSFormData() {
  this.useNFS = false;
  this.serverAddress = '';
  this.mountPoint = '';
  this.version = 4;
  this.options = 'rw,noatime,rsize=8192,wsize=8192,tcp,timeo=14';
}