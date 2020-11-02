export default class LicenseItemController {
  isInvalid() {
    return this.form.licenseInput.$invalid || (this.keyValidation && !this.keyValidation.status);
  }
}
