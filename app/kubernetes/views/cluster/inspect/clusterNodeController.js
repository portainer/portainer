import angular from 'angular';
// import _ from 'lodash-es';

class KubernetesClusterNodeController {
    /* @ngInject */
    constructor($async, $state, $transition$, Notifications, KubernetesNodeService, KubernetesEventService) {
        this.$async = $async;
        this.$state = $state;
        this.$transition$ = $transition$;
        this.Notifications = Notifications;
        this.KubernetesNodeService = KubernetesNodeService;
        this.KubernetesEventService = KubernetesEventService;

        this.onInit = this.onInit.bind(this);
        this.getNode = this.getNode.bind(this);
        this.getNodeAsync = this.getNodeAsync.bind(this);
        this.getEvents = this.getEvents.bind(this);
        this.getEventsAsync = this.getEventsAsync.bind(this);
    }

    async getNodeAsync() {
        try {
            this.state.dataLoading = true;
            const nodeName = this.$transition$.params().name;
            this.node = await this.KubernetesNodeService.get(nodeName);
        } catch (err) {
            this.Notifications.error(
                'Failure',
                err,
                'Unable to retrieve node'
            )
        } finally {
            this.state.dataLoading = false
        }
    }

    getNode() {
        return this.$async(this.getNodeAsync);
    }

    async getEventsAsync() {
        try {
            this.state.eventsLoading = true;
            this.events = await this.KubernetesEventService.events(this.node.Name);
        } catch (err) {
            this.Notifications.error(
                'Failure',
                err,
                'Unable to retrieve node events'
            )
        } finally {
            this.state.eventsLoading = false
        }
    }

    getEvents() {
        return this.$async(this.getEventsAsync);
    }

    async onInit() {
        this.state = {
            activeTab: 0,
            dataLoading: true,
            eventsLoading: true
        };

        this.getNode().then(() => this.getEvents());
    }

    $onInit() {
        return this.$async(this.onInit);
    }
}

export default KubernetesClusterNodeController;
angular.module(
    'portainer.kubernetes'
).controller(
    'KubernetesClusterNodeController',
    KubernetesClusterNodeController
);