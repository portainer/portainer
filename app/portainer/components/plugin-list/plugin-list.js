angular.module('portainer.app').component('pluginList', {
  templateUrl: 'app/portainer/components/plugin-list/pluginList.html',
  controller: function() {
    var ctrl = this;

    ctrl.plugins = [
      {
        Name: 'Registry management',
        ShortDescription: 'Enable in-app registry management',
        Price: '$29.99',
        Description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed gravida sem nec metus fermentum ultrices. Nullam non magna volutpat, auctor tellus sit amet, vulputate est. Phasellus bibendum nibh augue, ut mollis massa ultrices at. Praesent volutpat, ligula ut ullamcorper consequat, massa massa pharetra nisi, eu tincidunt libero leo at mi. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Sed placerat, nulla et dignissim porta, tellus purus aliquam mi, ac \ tempor lacus lacus sed sem. Quisque ac lacus eget enim tempus lobortis et pharetra nisl. Pellentesque augue sapien, viverra non eros sit amet, efficitur rhoncus tellus. \
        Sed tristique congue dui ac dapibus. Nulla consequat est a sollicitudin pulvinar. Vivamus vitae felis magna. Fusce ut tincidunt nulla, sit amet euismod nunc. Donec ac sem pretium, egestas lectus eget, mollis magna. Proin placerat non nisl vel elementum. Curabitur pretium iaculis libero, sit amet euismod sem efficitur a. Maecenas porttitor nisi sollicitudin facilisis faucibus. Aliquam erat volutpat.'
      },
      {
        Name: '2FA',
        ShortDescription: 'Enable two-factor authentication',
        Price: '$29.99',
        Description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed gravida sem nec metus fermentum ultrices. Nullam non magna volutpat, auctor tellus sit amet, vulputate est. Phasellus bibendum nibh augue, ut mollis massa ultrices at. Praesent volutpat, ligula ut ullamcorper consequat, massa massa pharetra nisi, eu tincidunt libero leo at mi. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Sed placerat, nulla et dignissim porta, tellus purus aliquam mi, ac \ tempor lacus lacus sed sem. Quisque ac lacus eget enim tempus lobortis et pharetra nisl. Pellentesque augue sapien, viverra non eros sit amet, efficitur rhoncus tellus. \
        Sed tristique congue dui ac dapibus. Nulla consequat est a sollicitudin pulvinar. Vivamus vitae felis magna. Fusce ut tincidunt nulla, sit amet euismod nunc. Donec ac sem pretium, egestas lectus eget, mollis magna. Proin placerat non nisl vel elementum. Curabitur pretium iaculis libero, sit amet euismod sem efficitur a. Maecenas porttitor nisi sollicitudin facilisis faucibus. Aliquam erat volutpat.'
      }
    ];
  }
});
