import { SubscriptionViewModel } from '../models/subscription';

angular.module('portainer.azure').factory('SubscriptionService', [
  '$q',
  'Subscription',
  function SubscriptionServiceFactory($q, Subscription) {
    return { subscription };

    async function subscription(id) {
      const subscription = await Subscription.get({ id }).$promise;
      return new SubscriptionViewModel(subscription);
    }
  },
]);
