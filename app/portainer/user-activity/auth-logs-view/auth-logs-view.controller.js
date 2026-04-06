import moment from 'moment';
import i18n from '@/i18n';

import { FeatureId } from '@/react/portainer/feature-flags/enums';

export default class AuthLogsViewController {
  /* @ngInject */
  constructor($async, Notifications) {
    this.$async = $async;
    this.Notifications = Notifications;
    this.t = i18n.t.bind(i18n);

    // Page header translations
    this.pageTitle = this.t('logs.authentication_title');
    this.pageBreadcrumbs = [{ label: this.t('logs.authentication_breadcrumbs') }];

    this.limitedFeature = FeatureId.ACTIVITY_AUDIT;
    this.state = {
      keyword: '',
      date: {
        from: 0,
        to: 0,
      },
      sort: {
        key: 'Timestamp',
        desc: true,
      },
      contextFilter: [1, 2, 3],
      typeFilter: [1, 2, 3],
      page: 1,
      limit: 10,
      totalItems: 0,
      logs: null,
    };

    this.today = moment().endOf('day');
    this.minValidDate = moment().subtract(7, 'd').startOf('day');

    this.onChangeDate = this.onChangeDate.bind(this);
    this.onChangeKeyword = this.onChangeKeyword.bind(this);
    this.onChangeSort = this.onChangeSort.bind(this);
    this.onChangeContextFilter = this.onChangeContextFilter.bind(this);
    this.onChangeTypeFilter = this.onChangeTypeFilter.bind(this);
    this.loadLogs = this.loadLogs.bind(this);
    this.onChangePage = this.onChangePage.bind(this);
    this.onChangeLimit = this.onChangeLimit.bind(this);
  }

  onChangePage(page) {
    this.state.page = page;
    this.loadLogs();
  }

  onChangeLimit(limit) {
    this.state.page = 1;
    this.state.limit = limit;
    this.loadLogs();
  }

  onChangeSort(sort) {
    this.state.page = 1;
    this.state.sort = sort;
    this.loadLogs();
  }

  onChangeContextFilter(filterKey, filterState) {
    this.state.contextFilter = filterState;
    this.loadLogs();
  }

  onChangeTypeFilter(filterKey, filterState) {
    this.state.typeFilter = filterState;
    this.loadLogs();
  }

  onChangeKeyword(keyword) {
    return this.$scope.$evalAsync(() => {
      this.state.page = 1;
      this.state.keyword = keyword;
      this.loadLogs();
    });
  }

  onChangeDate({ startDate, endDate }) {
    this.state.page = 1;
    this.state.date = { to: endDate, from: startDate };
    this.loadLogs();
  }

  async loadLogs() {
    return this.$async(async () => {
      this.state.logs = null;
      try {
        const { logs, totalCount } = { logs: [], totalCount: 0 };
        this.state.logs = decorateLogs(logs);
        this.state.totalItems = totalCount;
      } catch (err) {
        this.Notifications.error(this.t('common.failure'), err, this.t('logs.load_error'));
      }
    });
  }

  $onInit() {
    return this.$async(async () => {
      this.loadLogs();
    });
  }
}

function decorateLogs(logs) {
  return logs;
}
