import autocomplete from 'autocompleter';
import './search.css';
import searchUIModel from '../../search/models';

// This is a POC showcasing the ability to search for resources across environments
// It leverages snapshots to search across environment resources and exposes a new API over /api/search
// It has the following current limitations:
// * Redirecting to a resource located inside a Swarm cluster has not been validated (nodeName injection required)
// * Redirecting to a resource located inside an Edge environment has not been validated
// * Redirecting to an Aure environment has not been validated
// * Since Kubernetes environments do not use the snapshot feature, it is not possible to search across k8s resources
// * Since Azure ACI environments do not use the snapshot feature, it is not possible to search across ACI resources
// * Snapshots are also not supporting Swarm resources, it is not possible to search across Swarm services/configs/secrets
// * It is not possible to search across stacks
// * The error handling layer and debugging messages in the backend are pretty lightweight
// * It uses some CSS hacks with :before to properly display icons in HTML inputs
// * It wasn't tested/validated at scale (e.g. a lot of environments/resources)
// * Do not apply dark mode / high contrast theme

// TLDR
// * No support for ACI environments
// * No support for Kubernetes environments
// * No support to search across stacks
// * Edge/Swarm+Agent not tested likely to not work
// * Not tested at scale
// * Do not support dark mode / high contrast themes

export default class SearchController {
  /* @ngInject */
  constructor($state, SearchService, Notifications, EndpointProvider) {
    this.$state = $state;
    this.SearchService = SearchService;
    this.Notifications = Notifications;
    this.EndpointProvider = EndpointProvider;

    this.redirectUserBaseOnSelectedResource = this.redirectUserBaseOnSelectedResource.bind(this);
    this.changeAppState = this.changeAppState.bind(this);
    this.search = this.search.bind(this);
  }

  changeAppState(envId, envType) {
    if (envType === "azure") {
      this.$state.go('azure.dashboard', { endpointId: envId });
      return;
    }

    // TODO: need to properly handle Edge environments redirects
    // if (envType === "edge") {}
  
    if (envType === "kubernetes") {
      this.$state.go('kubernetes.dashboard', { endpointId: envId });
      return;
    }
  
    this.$state.go('docker.dashboard', { endpointId: envId });
  };
  

  redirectUserBaseOnSelectedResource(resource) {
    if (resource.group === "ENVIRONMENT") {
      this.changeAppState(resource.envId, resource.envType);
      return;
    }
    
    this.EndpointProvider.setEndpointID(resource.envId);
    switch (resource.group) {
      case "CONTAINER":
        this.$state.go('docker.containers.container', { endpointId: resource.envId, id: resource.resourceId });
        break;
      case "IMAGE":
        this.$state.go('docker.images.image', { endpointId: resource.envId, id: resource.resourceId });
        break;
      case "VOLUME":
        this.$state.go('docker.volumes.volume', { endpointId: resource.envId, id: resource.resourceId });
        break;
      case "NETWORK":
        this.$state.go('docker.networks.network', { endpointId: resource.envId, id: resource.resourceId });
        break;
    }
  }

  search(query, updateCallback) {
    this.SearchService.search(query).then(function success(data) {
      if (data.ResultCount) {
        const transformedData = transformAPItoUIModel(data.Results);
        updateCallback(transformedData);
      }
    })
    .catch(function error(err) {
      this.Notifications.error('Failure', err, 'Unable to execute search request');
    });
  }

  renderResource(item) {
    let div = document.createElement("div");
    div.className = "boxitem";

    let iconSpan = document.createElement("span");
    iconSpan.className = "boxitem-icon";

    let iconSpanHTML = "";
    switch (item.group) {
      case "ENVIRONMENT":
        switch (item.envType) {
          case "docker":
            iconSpanHTML = '<i class="boxitem-icon-ico-docker" aria-hidden="true"></i>';
            break;
          case "kubernetes":
            iconSpanHTML = '<i class="boxitem-icon-ico-kubernetes" aria-hidden="true"></i>';
            break;
          case "edge":
            iconSpanHTML = '<i class="boxitem-icon-ico-edge" aria-hidden="true"></i>';
            break;                                
          default:
            iconSpanHTML = '<i class="boxitem-icon-ico-generic" aria-hidden="true"></i>';
        }                
        break;
      case "CONTAINER":
        iconSpanHTML = '<i class="boxitem-icon-ico-container" aria-hidden="true"></i>';
        break;
      case "IMAGE":
        iconSpanHTML = '<i class="boxitem-icon-ico-image" aria-hidden="true"></i>';
        break;                                
      case "NETWORK":
        iconSpanHTML = '<i class="boxitem-icon-ico-network" aria-hidden="true"></i>';
        break;                                
      case "VOLUME":
        iconSpanHTML = '<i class="boxitem-icon-ico-volume" aria-hidden="true"></i>';
        break;                                                                  
      default:
        iconSpanHTML = '<i class="boxitem-icon-ico-generic" aria-hidden="true"></i>';
    }
    iconSpan.innerHTML = iconSpanHTML;
    div.appendChild(iconSpan);

    let nameSpan = document.createElement("span");
    nameSpan.className = "boxitem-name";
    nameSpan.textContent = item.label;
    div.appendChild(nameSpan);

    let endpointSpan = document.createElement("span");
    endpointSpan.className = "boxitem-env";

    let endpointSpanIcon = document.createElement("span");
    let endpointIconSpanHTML = "";
    if (item.group != "ENVIRONMENT") {
      switch (item.envType) {
        case "docker":
          endpointIconSpanHTML = '<i class="boxitem-icon-ico-docker" aria-hidden="true"></i>';
          break;
        case "kubernetes":
          endpointIconSpanHTML = '<i class="boxitem-icon-ico-kubernetes" aria-hidden="true"></i>';
          break;
        case "edge":
          endpointIconSpanHTML = '<i class="boxitem-icon-ico-edge" aria-hidden="true"></i>';
          break;                                
        default:
          endpointIconSpanHTML = '<i class="boxitem-icon-ico-generic" aria-hidden="true"></i>';
      }
    }
    endpointSpanIcon.innerHTML = endpointIconSpanHTML;
    endpointSpan.appendChild(endpointSpanIcon);

    let endpointSpanName = document.createElement("span");
    endpointSpanName.className = "boxitem-env-name";
    endpointSpanName.textContent = item.envName;
    endpointSpan.appendChild(endpointSpanName);
    
    div.appendChild(endpointSpan);

    return div;
  }

  renderGroup(groupName) {
    let div = document.createElement("div");
    div.className = "boxgroup";
    div.textContent = groupName;
    return div;
  }

  initSearchInput() {
    const input = document.getElementById("resource-search");

    autocomplete({
      onSelect: this.redirectUserBaseOnSelectedResource,
      fetch: this.search,
      input: input,
      minLength: 2,
      emptyMsg: 'No resource found',
      render: this.renderResource,
      renderGroup: this.renderGroup,
      debounceWaitMs: 200,
    });
  }

  $onInit() {
    this.initSearchInput();
  }
}

function transformAPItoUIModel(data) {
  var uiModel = data.map(function (item) {
    return new searchUIModel(item);
  });

  return uiModel;
}
