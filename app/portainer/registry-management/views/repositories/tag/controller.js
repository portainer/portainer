import _ from 'lodash-es';
import { RegistryImageLayerViewModel } from '@/portainer/registry-management/models/registryImageLayer';
import { RegistryImageDetailsViewModel } from '@/portainer/registry-management/models/registryImageDetails';

export class RegistryRepositoryTagController {
  /* @ngInject */
  constructor($state, $async, Notifications, RegistryService, RegistryServiceSelector, imagelayercommandFilter) {
    Object.assign(this, { $state, $async, Notifications, RegistryService, RegistryServiceSelector, imagelayercommandFilter });

    this.context = {};

    this.$onInit = this.$onInit.bind(this);
    this.$onInitAsync = this.$onInitAsync.bind(this);
  }

  toggleLayerCommand(layerId) {
    $('#layer-command-expander' + layerId + ' span').toggleClass('glyphicon-plus-sign glyphicon-minus-sign');
    $('#layer-command-' + layerId + '-short').toggle();
    $('#layer-command-' + layerId + '-full').toggle();
  }

  order(sortType) {
    this.Sort.Reverse = this.Sort.Type === sortType ? !this.Sort.Reverse : false;
    this.Sort.Type = sortType;
  }

  $onInit() {
    return this.$async(this.$onInitAsync);
  }
  async $onInitAsync() {
    this.context.registryId = this.$state.params.id;
    this.context.repository = this.$state.params.repository;
    this.context.tag = this.$state.params.tag;
    this.Sort = {
      Type: 'Order',
      Reverse: false,
    };
    try {
      this.registry = await this.RegistryService.registry(this.context.registryId);
      this.tag = await this.RegistryServiceSelector.tag(this.registry, this.context.repository, this.context.tag);
      const length = this.tag.History.length;
      this.history = _.map(this.tag.History, (layer, idx) => new RegistryImageLayerViewModel(length - idx, layer));
      _.forEach(this.history, (item) => (item.CreatedBy = this.imagelayercommandFilter(item.CreatedBy)));
      this.details = new RegistryImageDetailsViewModel(this.tag.History[0]);
    } catch (error) {
      this.Notifications.error('Failure', error, 'Unable to retrieve tag');
    }
  }
}
