import moment from 'moment';

import { FeatureId } from '@/portainer/feature-flags/enums';
export default class ActivityLogsViewController {
  /* @ngInject */
  constructor($async, Notifications) {
    this.$async = $async;
    this.Notifications = Notifications;

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

  onChangeKeyword(keyword) {
    this.state.page = 1;
    this.state.keyword = keyword;
    this.loadLogs();
  }

  onChangeDate({ startDate, endDate }) {
    this.state.page = 1;
    this.state.date = { to: endDate, from: startDate };
    this.loadLogs();
  }

  async export() {
    return this.$async(async () => {
      try {
        await this.UserActivityService.saveLogsAsCSV(this.state.sort, this.state.keyword, this.state.date, this.state.contextFilter);
      } catch (err) {
        this.Notifications.error('Failure', err, 'Failed loading user activity logs csv');
      }
    });
  }

  async loadLogs() {
    return this.$async(async () => {
      this.state.logs = null;
      try {
        const { logs, totalCount } = { logs: [{}, {}, {}, {}, {}], totalCount: 5 };
        this.state.logs = logs;
        this.state.totalItems = totalCount;
      } catch (err) {
        this.Notifications.error('Failure', err, 'Failed loading user activity logs');
      }
    });
  }

  $onInit() {
    return this.$async(async () => {
      this.loadLogs();
    });
  }
}
