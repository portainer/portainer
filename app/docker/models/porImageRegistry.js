/**
 * This model should be used with por-image-registry component
 * And bound to the 'model' attribute
 *
 * // viewController.js
 *
 * this.imageModel = new PorImageRegistryModel();
 *
 * // view.html
 * <por-image-registry model="$ctrl.imageModel" ... />
 */
export function PorImageRegistryModel() {
  this.UseRegistry = true;
  this.Registry = {};
  this.Image = '';
}
