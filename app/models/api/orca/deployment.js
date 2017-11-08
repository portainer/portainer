function DeploymentViewModel(data) {
  this.Id = data.Deployment.DeploymentName;
  this.Name = data.Deployment.DeploymentName;

  if (data.Deployment.Release) {
    this.Release = data.Deployment.Release;
  } else {
    this.Release = "Unknown"
  }

  this.ParentDirName = data.ParentDirName;

  if (data.Content) {
    this.Content = data.Content
  } else {
    this.Content = "Default stack content"
  }

  if (data.Deployment.StackType) {
    this.StackType = data.Deployment.StackType
  } else {
    this.StackType = "Unknown"
  }

  //[{"Deployment":{"Version":"1","Owner":"operator@cenx.com","DeploymentName":"env-qa-devops-01","TemplateBranch":"","TemplateRepo":"/Users/andrew.ceponkus/cenx-repos/exanova-templates","ManifestBranch":"","ManifestRepo":"/Users/andrew.ceponkus/cenx-repos/exanova","CapiDocsRepo":"","CustomizationRepo":"","IpFormat":"","Scale":"medium","Customer":"h3g","Project":"vcp","Release":"","MachineDefaultEntries":{"DockerPort":2375,"TlsVerify":false,"TlsCert":"","TlsKey":"","TlsCaCert":"","Timeout":240,"Driver":"vmware","User":"deployer","RsyncPort":873,"OrcaHostIp":"172.16.55.128,192.168.8.25,192.168.8.28,172.16.55.115,192.168.8.22","SkipReboot":1,"DeploymentKeyfile":"~/.ssh/development.pem","DeploymentUser":"root","IaasProvider":"aws","IaasRegion":"us-east-1"},"MachineEntries":{"system01":{"Ip":"172.32.1.25","Hostname":"system01.qa-devops-01.cenx.localnet","SocketPath":"","Label":["analytics","build"],"TlsCert":"","TlsKey":"","TlsCaCert":""},"tools01":{"Ip":"172.32.1.105","Hostname":"tools01.qa-devops-01.cenx.localnet","SocketPath":"","Label":["tools","ui","audit","augment","fault","datomic","manager"],"TlsCert":"","TlsKey":"","TlsCaCert":""}}},"ParentDirName":"envs"},{"Deployment":{"Version":"1","Owner":"operator@cenx.com","DeploymentName":"test2","TemplateBranch":"","TemplateRepo":"/Users/andrew.ceponkus/cenx-repos/exanova-templates","ManifestBranch":"","ManifestRepo":"/Users/andrew.ceponkus/cenx-repos/exanova","CapiDocsRepo":"","CustomizationRepo":"","IpFormat":"ipv6","Scale":"small","Customer":"cenx","Project":"pseudotel","Release":"7.1.1","MachineDefaultEntries":{"DockerPort":2375,"TlsVerify":false,"TlsCert":"","TlsKey":"","TlsCaCert":"","Timeout":120,"Driver":"vmware","User":"deployer","RsyncPort":873,"OrcaHostIp":"192.168.8.48,192.168.8.57,192.168.0.16,192.168.8.141,192.168.8.74","SkipReboot":1,"DeploymentKeyfile":"~/.ssh/development.pem","DeploymentUser":"root","IaasProvider":"aws","IaasRegion":"us-east-1"},"MachineEntries":{"tools01":{"Ip":"172.32.1.105","Hostname":"","SocketPath":"/var/run/docker.sock","Label":["tools","ui","audit","augment","fault","datomic","analytics","build","manager"],"TlsCert":"","TlsKey":"","TlsCaCert":""}}},"ParentDirName":"envs"},{"Deployment":{"Version":"1","Owner":"operator@cenx.com","DeploymentName":"test711","TemplateBranch":"","TemplateRepo":"/Users/andrew.ceponkus/cenx-repos/exanova-templates","ManifestBranch":"","ManifestRepo":"/Users/andrew.ceponkus/cenx-repos/exanova","CapiDocsRepo":"/Users/andrew.ceponkus/cenx-repos/customization-documents","CustomizationRepo":"","IpFormat":"ipv4","Scale":"small","Customer":"verizon","Project":"vcp","Release":"7.1.1","MachineDefaultEntries":{"DockerPort":2375,"TlsVerify":false,"TlsCert":"","TlsKey":"","TlsCaCert":"","Timeout":120,"Driver":"vmware","User":"deployer","RsyncPort":873,"OrcaHostIp":"192.168.8.141,192.168.8.74,192.168.8.22,192.168.0.19,192.168.8.58","SkipReboot":1,"DeploymentKeyfile":"~/.ssh/development.pem","DeploymentUser":"root","IaasProvider":"aws","IaasRegion":"us-east-1"},"MachineEntries":{"tools01":{"Ip":"172.17.0.1","Hostname":"","SocketPath":"/var/run/docker.sock","Label":["tools","ui","audit","augment","fault","datomic","analytics","build","manager"],"TlsCert":"","TlsKey":"","TlsCaCert":""}}},"ParentDirName":"envs"}]

  //[{"Id":1,"Name":"tools01","URL":"tcp://172.32.1.105:2375","PublicURL":"172.32.1.105","TLSConfig":{"TLS":false,"TLSSkipVerify":false},"AuthorizedUsers":[],"AuthorizedTeams":[]}]
}
