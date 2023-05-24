/* @ngInject */
export default function HiddenContainersPanelController($async) {
  this.addFilteredContainerLabel = addFilteredContainerLabel.bind(this);
  this.removeFilteredContainerLabel = removeFilteredContainerLabel.bind(this);
  this.$onInit = $onInit.bind(this);
  this.handleSubmit = handleSubmit.bind(this);

  this.state = {
    actionInProgress: false,
  };

  this.formValues = {
    BlackListedLabels: [],
    labelName: '',
    labelValue: '',
  };

  this.state = {
    actionInProgress: false,
  };

  function addFilteredContainerLabel() {
    const label = {
      name: this.formValues.labelName,
      value: this.formValues.labelValue,
    };

    const filteredSettings = [...this.formValues.BlackListedLabels, label];
    this.handleSubmit(filteredSettings);
    this.formValues.labelName = '';
    this.formValues.labelValue = '';
  }

  function removeFilteredContainerLabel(index) {
    const filteredSettings = this.formValues.BlackListedLabels.filter((item, i) => i !== index);
    this.handleSubmit(filteredSettings);
  }

  function handleSubmit(labels) {
    return $async(async () => {
      this.state.actionInProgress = true;
      await this.onSubmit({ BlackListedLabels: labels }, 'Hidden container settings updated');
      this.formValues.BlackListedLabels = labels;
      this.state.actionInProgress = false;
    });
  }

  function $onInit() {
    this.formValues.BlackListedLabels = this.settings.BlackListedLabels;
  }
}
