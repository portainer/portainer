function CreateEdgeJobController($q, $state, Notifications, GroupService, EdgeJobService, TagService) {
  this.state = {
    actionInProgress: false,
  };

  this.create = create.bind(this);

  function create(method) {
    const model = this.model;

    this.state.actionInProgress = true;
    createEdgeJob(method, model)
      .then(() => {
        Notifications.success('Edge job successfully created');
        $state.go('edge.jobs', {}, { reload: true });
      })
      .catch((err) => {
        Notifications.error('Failure', err, 'Unable to create Edge job');
      })
      .finally(() => {
        this.state.actionInProgress = false;
      });
  }

  function createEdgeJob(method, model) {
    if (method === 'editor') {
      return EdgeJobService.createEdgeJobFromFileContent(model);
    }
    return EdgeJobService.createEdgeJobFromFileUpload(model);
  }

  this.$onInit = $onInit;

  function $onInit() {
    this.model = {
      Name: '',
      Recurring: false,
      CronExpression: '',
      Endpoints: [],
      FileContent: '',
      File: null,
    };

    $q.all({
      groups: GroupService.groups(),
      tags: TagService.tags(),
    })
      .then((data) => {
        this.groups = data.groups;
        this.tags = data.tags;
      })
      .catch((err) => {
        Notifications.error('Failure', err, 'Unable to retrieve endpoint list');
      });
  }
}

angular.module('portainer.edge').controller('CreateEdgeJobController', CreateEdgeJobController);
export default CreateEdgeJobController;
