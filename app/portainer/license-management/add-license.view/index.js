import angular from 'angular';

import { addLicenseView } from './add-license.view';
import { licensesForm } from './licenses-form';
import { licenseFormItem } from './licenses-form/license-item';

export default angular
  .module('portainer.app.license-management.add-license-view', [])

  .component('addLicenseView', addLicenseView)
  .component('licensesForm', licensesForm)
  .component('licenseFormItem', licenseFormItem).name;
