import { parseDotEnvFile } from '@/portainer/helpers/env-vars';

export default class EnvironmentVariablesSimpleModeController {
  /* @ngInject */
  constructor($async) {
    this.$async = $async;

    this.onChangeVariable = this.onChangeVariable.bind(this);
    this.remove = this.remove.bind(this);
  }

  add() {
    this.onChange([...this.ngModel, { name: '', value: '' }]);
  }

  remove(index) {
    this.onChange(this.ngModel.filter((_, i) => i !== index));
  }

  addFromFile(file) {
    return this.$async(async () => {
      if (!file) {
        return;
      }
      const text = await this.getTextFromFile(file);
      const parsed = parseDotEnvFile(text);
      this.onChange(this.ngModel.concat(parsed));
    });
  }

  getTextFromFile(file) {
    return new Promise((resolve, reject) => {
      const temporaryFileReader = new FileReader();
      temporaryFileReader.readAsText(file);
      temporaryFileReader.onload = (event) => resolve(event.target.result);
      temporaryFileReader.onerror = (error) => reject(error);
    });
  }

  onChangeVariable(index, variable) {
    this.onChange(this.ngModel.map((v, i) => (i !== index ? v : variable)));
  }
}
