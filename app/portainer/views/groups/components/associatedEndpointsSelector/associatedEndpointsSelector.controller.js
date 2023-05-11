import { queryClient } from '@/react-tools/react-query';

class AssociatedEndpointsSelectorController {
  /* @ngInject */
  constructor($async) {
    this.$async = $async;

    this.state = {
      available: {
        query: {
          groupIds: [1],
        },
      },
      associated: {
        query: {
          endpointIds: [],
        },
      },
    };

    this.associateEndpoint = this.associateEndpoint.bind(this);
    this.dissociateEndpoint = this.dissociateEndpoint.bind(this);
  }

  $onChanges({ endpointIds }) {
    if (endpointIds && endpointIds.currentValue) {
      queryClient.invalidateQueries(['environments']);
      this.state.associated.query = { endpointIds: endpointIds.currentValue };
    }
  }

  /* #endregion */

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
