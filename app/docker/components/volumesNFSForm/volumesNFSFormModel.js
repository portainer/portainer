export function VolumesNFSFormData() {
  this.useNFS = false;
  this.serverAddress = '';
  this.mountPoint = '';
  this.version = 'NFS4';
  this.options = 'rw,noatime,rsize=8192,wsize=8192,tcp,timeo=14';
  this.versions = ['NFS4', 'NFS'];
}
