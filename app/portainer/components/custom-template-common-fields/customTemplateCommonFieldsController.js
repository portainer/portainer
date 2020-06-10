class CustomTemplateCommonFieldsController {
  /* @ngInject */
  constructor() {
    this.platformTypes = [
      { label: 'Linux', value: 1 },
      { label: 'Windows', value: 2 },
    ];

    this.templateTypes = [
      { label: 'Standalone', value: 1 },
      { label: 'Swarm', value: 2 },
    ];
  }
}

export default CustomTemplateCommonFieldsController;
