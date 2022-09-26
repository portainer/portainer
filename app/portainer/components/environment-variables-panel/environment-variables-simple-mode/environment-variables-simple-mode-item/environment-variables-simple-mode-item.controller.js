class EnvironmentVariablesSimpleModeItemController {
  onChangeName(name) {
    const fieldIsInvalid = typeof name === 'undefined';
    if (fieldIsInvalid) {
      return;
    }

    this.onChange(this.index, { ...this.variable, name });
  }

  onChangeValue(value) {
    const fieldIsInvalid = typeof value === 'undefined';
    if (fieldIsInvalid) {
      return;
    }

    this.onChange(this.index, { ...this.variable, value });
  }

  $onInit() {
    this.formName = `variableForm${this.index}`;
  }
}

export default EnvironmentVariablesSimpleModeItemController;
