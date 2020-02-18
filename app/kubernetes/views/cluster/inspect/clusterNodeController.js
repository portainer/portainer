import angular from 'angular';
import _ from 'lodash-es';
import filesizeParser from 'filesize-parser';

class KubernetesClusterNodeController {
    /* @ngInject */
    constructor(
        $async,
        $state,
        $transition$,
        Notifications,
        KubernetesNodeService,
        KubernetesEventService,
        KubernetesPodService,
        KubernetesApplicationService
    ) {
        this.$async = $async;
        this.$state = $state;
        this.$transition$ = $transition$;
        this.Notifications = Notifications;
        this.KubernetesNodeService = KubernetesNodeService;
        this.KubernetesEventService = KubernetesEventService;
        this.KubernetesPodService = KubernetesPodService;
        this.KubernetesApplicationService = KubernetesApplicationService;

        this.onInit = this.onInit.bind(this);
        this.getNode = this.getNode.bind(this);
        this.getNodeAsync = this.getNodeAsync.bind(this);
        this.getEvents = this.getEvents.bind(this);
        this.getEventsAsync = this.getEventsAsync.bind(this);
        this.getPods = this.getPods.bind(this);
        this.getPodsAsync = this.getPodsAsync.bind(this);
        this.getApplications = this.getApplications.bind(this);
        this.getApplicationsAsync = this.getApplicationsAsync.bind(this);

        this.computePodsResourceReservation = this.computePodsResourceReservation.bind(this);
        this.usageLevelInfo = this.usageLevelInfo.bind(this);
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
            );
        } finally {
            this.state.dataLoading = false;
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
            );
        } finally {
            this.state.eventsLoading = false;
        }
    }

    getEvents() {
        return this.$async(this.getEventsAsync);
    }

    async getPodsAsync() {
        try {
            this.state.podsLoading = true;
            const pods = await this.KubernetesPodService.pods();
            this.pods = _.filter(pods, pod => pod.Node === this.node.Name);
            this.ResourceReservation = this.computePodsResourceReservation(this.pods);

            const memory = filesizeParser(this.node.Memory, { base: 10 });
            if (this.node.CPU && memory) {
                this.ResourceUsage = {
                    Memory: Math.round(this.ResourceReservation.Memory / memory * 100),
                    CPU: Math.round(this.ResourceReservation.CPU / this.node.CPU * 100)
                };
            }
        } catch (err) {
            this.Notifications.error(
                'Failure',
                err,
                'Unable to retrieve pods'
            );
        } finally {
            this.state.podsLoading = false;
        }
    }

    getPods() {
        return this.$async(this.getPodsAsync);
    }

    async getApplicationsAsync() {
        try {
            this.state.applicationsLoading = true;
            this.applications = await this.KubernetesApplicationService.applications();

            this.applications = _.map(
                this.applications,
                app => {
                    app.pods = _.filter(
                        this.pods,
                        pod => _.startsWith(pod.Metadata.name, app.Name)
                    );

                    app.ResourceReservation = this.computePodsResourceReservation(app.pods);
                    return app;
                }
            );
        } catch (err) {
            this.Notifications.error(
                'Failure',
                err,
                'Unable to retrieve applications'
            );
        } finally {
            this.state.applicationsLoading = false;
        }
    }

    getApplications() {
        return this.$async(this.getApplicationsAsync);
    }

    async onInit() {
        this.state = {
            activeTab: 0,
            dataLoading: true,
            eventsLoading: true,
            podsLoading: true,
            applicationsLoading: true
        };

        this.getNode().then(() => {
            this.getEvents();
            this.getPods().then(() => {
                this.getApplications();
            });
        });
    }

    $onInit() {
        return this.$async(this.onInit);
    }

    computePodsResourceReservation(pods) {
        const containers = _.reduce(pods, (acc, pod) => _.concat(acc, pod.Containers), []);

        return _.reduce(containers, (acc, container) => {
            if (container.resources && container.resources.requests) {
                
                if (container.resources.requests.memory) {
                    acc.Memory += filesizeParser(
                        container.resources.requests.memory,
                        { base: 10 }
                    );
                }
                
                if (container.resources.requests.cpu) {
                    const cpu = parseInt(container.resources.requests.cpu);
                    if (_.endsWith(container.resources.requests.cpu, 'm')) {
                        acc.CPU += cpu / 1000;
                    } else {
                        acc.CPU += cpu;
                    }
                }
            }
            return acc;
        }, { Memory: 0, CPU: 0 });
    }

    usageLevelInfo(usage) {
        if (usage >= 80) {
            return 'danger';
        } else if (usage > 50 && usage < 80) {
            return 'warning';
        } else {
            return 'success';
        }
    }
}

export default KubernetesClusterNodeController;
angular.module(
    'portainer.kubernetes'
).controller(
    'KubernetesClusterNodeController',
    KubernetesClusterNodeController
);