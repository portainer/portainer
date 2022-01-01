import angular from 'angular';

import { sslCertificate } from './ssl-certificate';
import { openAMT } from './open-amt';

export default angular.module('portainer.settings.general', []).component('sslCertificateSettings', sslCertificate).component('openAmtSettings', openAMT).name;
