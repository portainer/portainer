export function ContainerGroupDefaultModel() {
  this.Location = '';
  this.OSType = 'Linux';
  this.Name = '';
  this.Image = '';
  this.AllocatePublicIP = true;
  this.Ports = [
    {
      container: 80,
      host: 80,
      protocol: 'TCP'
    }
  ];
  this.CPU = 1;
  this.Memory = 1;
}

export function ContainerGroupViewModel(data) {
  this.Id = data.id;
  this.Name = data.name;
  this.Location = data.location;
  this.IPAddress = data.properties.ipAddress.ip;
  this.Ports = data.properties.ipAddress.ports;
}

export function CreateContainerGroupRequest(model) {
  this.location = model.Location;

  var containerPorts = [];
  var addressPorts = [];
  for (var i = 0; i < model.Ports.length; i++) {
    var binding = model.Ports[i];

    containerPorts.push({
      port: binding.container
    });

    addressPorts.push({
      port: binding.host,
      protocol: binding.protocol
    });
  }

  this.properties = {
    osType: model.OSType,
    containers: [
      {
        name: model.Name,
        properties: {
          image: model.Image,
          ports: containerPorts,
          resources: {
            requests: {
              cpu: model.CPU,
              memoryInGB: model.Memory
            }
          }
        }
      }
    ],
    ipAddress: {
      type: model.AllocatePublicIP ? 'Public': 'Private',
      ports: addressPorts
    }
  };
}
