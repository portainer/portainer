class CustomTemplateCommonFieldsController {
  /* @ngInject */
  constructor() {
    this.platformTypes = [
      { label: 'Linux', value: 1 },
      { label: 'Windows', value: 2 },
    ];

    this.templateTypes = [
      { label: 'Swarm', value: 1 },
      { label: 'Standalone', value: 2 },
    ];
  }
}

export default CustomTemplateCommonFieldsController;
