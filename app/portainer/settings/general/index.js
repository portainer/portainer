import angular from 'angular';

import { sslCertificate } from './ssl-certificate';
import { openAMT } from './open-amt';
import { fdo } from './fdo';

export default angular
  .module('portainer.settings.general', [])
  .component('sslCertificateSettings', sslCertificate)
  .component('openAmtSettings', openAMT)
  .component('fdoSettings', fdo).name;
