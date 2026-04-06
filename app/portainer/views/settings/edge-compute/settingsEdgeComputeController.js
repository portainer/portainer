import _ from 'lodash-es';
import angular from 'angular';
import i18n from '@/i18n';

import { configureAMT } from '@/portainer/hostmanagement/open-amt/open-amt.service';

angular.module('portainer.app').controller('SettingsEdgeComputeController', SettingsEdgeComputeController);

/* @ngInject */
export default function SettingsEdgeComputeController($q, $async, $state, Notifications, SettingsService, StateManager) {
  var ctrl = this;
  this.t = i18n.t.bind(i18n);

  // Page header translations
  this.pageTitle = this.t('settings.edge.title');
  this.pageBreadcrumbs = [
    { label: this.t('settings.title'), link: 'portainer.settings' },
    { label: this.t('settings.edge.breadcrumb') }
  ];

  this.onSubmitEdgeCompute = async function (settings) {
    try {
      await SettingsService.update(settings);
      Notifications.success(ctrl.t('common.success'), ctrl.t('settings.edge.update_success'));
      StateManager.updateEnableEdgeComputeFeatures(settings.EnableEdgeComputeFeatures);
      $state.reload();
    } catch (err) {
      Notifications.error(ctrl.t('common.failure'), err, ctrl.t('settings.edge.update_error'));
    }
  };

  this.onSubmitOpenAMT = async function (formValues) {
    try {
      await configureAMT(formValues);
      Notifications.success(ctrl.t('common.success'), ctrl.t(formValues.enabled ? 'settings.edge.openamt_success_enabled' : 'settings.edge.openamt_success_disabled'));
      $state.reload();
    } catch (err) {
      Notifications.error(ctrl.t('common.failure'), err, ctrl.t('settings.edge.openamt_error'));
    }
  };

  function initView() {
    $async(async () => {
      try {
        const settings = await SettingsService.settings();

        const defaultMTLS = {
          ..._.get(settings, 'Edge.MTLS', {}),
          UseSeparateCert: _.get(settings, 'Edge.MTLS.UseSeparateCert', false),
        };

        ctrl.settings = {
          ...settings,
          EnableEdgeComputeFeatures: !!settings.EnableEdgeComputeFeatures,
          EnforceEdgeID: !!settings.EnforceEdgeID,
          Edge: {
            ...settings.Edge,
            MTLS: defaultMTLS,
          },
        };
      } catch (err) {
        Notifications.error(ctrl.t('common.failure'), err, ctrl.t('settings.edge.retrieve_error'));
      }
    });
  }

  initView();
}
