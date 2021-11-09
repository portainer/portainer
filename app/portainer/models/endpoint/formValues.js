import { PortainerEndpointConnectionTypes } from 'Portainer/models/endpoint/models';

export class PortainerEndpointInitFormValues {
  constructor() {
    this.ConnectionType = PortainerEndpointConnectionTypes.KUBERNETES_LOCAL;
    this.Name = '';
    this.URL = '';
    this.TLS = false;
    this.TLSSkipVerify = false;
    this.TLSSKipClientVerify = false;
    this.TLSCACert = null;
    this.TLSCert = null;
    this.TLSKey = null;
    this.AzureApplicationId = '';
    this.AzureTenantId = '';
    this.AzureAuthenticationKey = '';
  }
}

class PortainerEndpointInitFormValueEndpointSection {
  constructor(value, title, classes, description) {
    this.Id = value;
    this.Value = value;
    this.Title = title;
    this.Classes = classes;
    this.Description = description;
  }
}

export const PortainerEndpointInitFormValueEndpointSections = Object.freeze([
  new PortainerEndpointInitFormValueEndpointSection(PortainerEndpointConnectionTypes.DOCKER_LOCAL, 'Docker', 'fab fa-docker', 'Manage the local Docker environment'),
  new PortainerEndpointInitFormValueEndpointSection(
    PortainerEndpointConnectionTypes.KUBERNETES_LOCAL,
    'Kubernetes',
    'fas fa-dharmachakra',
    'Manage the local Kubernetes environment'
  ),
  new PortainerEndpointInitFormValueEndpointSection(PortainerEndpointConnectionTypes.AGENT, 'Agent', 'fa fa-bolt', 'Connect to a Portainer agent'),
]);
