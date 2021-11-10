import angular from 'angular';

import { ReactExampleAngular } from '@/portainer/components/ReactExample';

import { sslCertificate } from './ssl-certificate';

export default angular.module('portainer.settings.general', []).component('sslCertificateSettings', sslCertificate).component('intelOpenAmtSettings', ReactExampleAngular).name;
