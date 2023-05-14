import { queryClient } from '@/react-tools/react-query';
import { EdgeTypes } from '@/react/portainer/environments/types';

class AssociatedEndpointsSelectorController {
  /* @ngInject */
  constructor($async) {
    this.$async = $async;

    this.state = {
      available: {
        query: {
          types: EdgeTypes,
        },
      },
      associated: {
        query: {
          endpointIds: [],
          types: EdgeTypes,
        },
      },
    };

    this.associateEndpoint = this.associateEndpoint.bind(this);
    this.dissociateEndpoint = this.dissociateEndpoint.bind(this);
    this.showEnvironment = this.showEnvironment.bind(this);
  }

  $onChanges({ endpointIds }) {
    if (endpointIds && endpointIds.currentValue) {
      this.state.associated.query = { endpointIds: endpointIds.currentValue };
      queryClient.invalidateQueries([['environments']]);
    }
  }

  /* #endregion */

  showEnvironment(environment) {
    console.log('showEnvironment', environment.Id, this.endpointIds, this.endpointIds.includes(environment.Id));
    return this.endpointIds.includes(environment.Id);
  }

  /* #region  On endpoint click (either available or associated) */
  associateEndpoint(endpoint) {
    this.onAssociate(endpoint.Id);
  }

  dissociateEndpoint(endpoint) {
    this.onDissociate(endpoint.Id);
  }
  /* #endregion */

  /* #endregion */
}

export default AssociatedEndpointsSelectorController;
