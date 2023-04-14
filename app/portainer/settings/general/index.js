import angular from 'angular';

import { sslCertificate } from './ssl-certificate';
import { sslCaFileSettings } from './ssl-ca-file-settings';

export default angular.module('portainer.settings.general', []).component('sslCertificateSettings', sslCertificate).component('sslCaFileSettings', sslCaFileSettings).name;
