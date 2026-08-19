export function VolumesCIFSFormData() {
  this.useCIFS = false;
  this.serverAddress = '';
  this.share = '';
  this.version = 'CIFS v2.0 (Used by Windows Vista / Server 2008)';
  this.versions = [
    'CIFS v1.0 (Used by Windows XP / Server 2003 and earlier)',
    'CIFS v2.0 (Used by Windows Vista / Server 2008)',
    'CIFS v2.1 (Used by Windows 7 / Server 2008 R2)',
    'CIFS 3.0 (Used by Windows 8 / Server 2012 and newer)',
  ];
  this.versionsNumber = ['1.0', '2.0', '2.1', '3.0'];
  this.username = '';
  this.password = '';
}
