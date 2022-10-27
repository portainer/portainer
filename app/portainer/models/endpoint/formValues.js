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
