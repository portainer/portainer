export class NodeSelectorController {
  constructor(AgentService, Notifications) {
    Object.assign(this, { AgentService, Notifications });
  }

  $onInit() {
    this.AgentService.agents()
      .then((data) => {
        this.agents = data;
        if (!this.model) {
          this.model = data[0].NodeName;
        }
      })
      .catch((err) => {
        this.Notifications.error('Failure', err, 'Unable to load agents');
      });
  }
}
