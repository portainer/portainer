import _ from 'lodash-es';
import angular from 'angular';
import { RegistryImageLayerViewModel } from 'Extensions/registry-management/models/registryImageLayer';
import { RegistryImageDetailsViewModel } from 'Extensions/registry-management/models/registryImageDetails';

class RegistryRepositoryTagController {

  /* @ngInject */
  constructor($transition$, $async, Notifications, RegistryService, RegistryServiceSelector, imagelayercommandFilter) {
    this.$transition$ = $transition$;
    this.$async = $async;
    this.Notifications = Notifications;
    this.RegistryService = RegistryService;
    this.RegistryServiceSelector = RegistryServiceSelector;
    this.imagelayercommandFilter = imagelayercommandFilter;

    this.context = {};
    this.onInit = this.onInit.bind(this);
  }

  toggleLayerCommand(layerId) {
		$('#layer-command-expander'+layerId+' span').toggleClass('glyphicon-plus-sign glyphicon-minus-sign');
		$('#layer-command-'+layerId+'-short').toggle();
		$('#layer-command-'+layerId+'-full').toggle();
	}

  order(sortType) {
    this.Sort.Reverse = (this.Sort.Type === sortType) ? !this.Sort.Reverse : false;
    this.Sort.Type = sortType;
  }

  async onInit() {
    this.context.registryId = this.$transition$.params().id;
    this.context.repository = this.$transition$.params().repository;
    this.context.tag = this.$transition$.params().tag;
    this.Sort = {
      Type: 'Order',
      Reverse: false
    }
    try {
      this.registry = await this.RegistryService.registry(this.context.registryId);
      this.tag = await this.RegistryServiceSelector.tag(this.registry, this.context.repository, this.context.tag);
      const length = this.tag.History.length;
      this.history = _.map(this.tag.History, (layer, idx) => new RegistryImageLayerViewModel(length - idx, layer));
      _.forEach(this.history, (item) => item.CreatedBy = this.imagelayercommandFilter(item.CreatedBy))
      this.details = new RegistryImageDetailsViewModel(this.tag.History[0]);
    } catch (error) {
      this.Notifications.error('Failure', error, 'Unable to retrieve tag')
    }
  }

  $onInit() {
    return this.$async(this.onInit);
  }
}
export default RegistryRepositoryTagController;
angular.module('portainer.extensions.registrymanagement').controller('RegistryRepositoryTagController', RegistryRepositoryTagController);
