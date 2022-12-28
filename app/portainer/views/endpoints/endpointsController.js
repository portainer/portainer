import { map } from 'lodash';
import { confirmDelete } from '@@/modals/confirm';

export class EndpointsController {
  /* @ngInject */
  constructor($state, $async, EndpointService, Notifications, EndpointProvider, StateManager) {
    Object.assign(this, {
      $state,
      $async,
      EndpointService,
      Notifications,
      EndpointProvider,
      StateManager,
    });

    this.removeAction = this.removeAction.bind(this);
  }

  removeAction(endpoints) {
    confirmDelete('This action will remove all configurations associated to your environment(s). Continue?').then((confirmed) => {
      if (!confirmed) {
        return;
      }
      return this.$async(async () => {
        try {
          await Promise.all(endpoints.map(({ Id }) => this.EndpointService.deleteEndpoint(Id)));
          this.Notifications.success('Environments successfully removed', map(endpoints, 'Name').join(', '));
        } catch (err) {
          this.Notifications.error('Failure', err, 'Unable to remove environment');
        }

        const id = this.EndpointProvider.endpointID();
        // If the current endpoint was deleted, then clean endpoint store
        if (endpoints.some((e) => e.Id === id)) {
          this.StateManager.cleanEndpoint();
        }

        this.$state.reload();
      });
    });
  }
}
