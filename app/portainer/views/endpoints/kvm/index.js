import angular from 'angular';

import { KVMControlAngular } from '@/portainer/views/endpoints/kvm/KVMControl';

angular.module('portainer.app').component('kvmControl', KVMControlAngular).name;
