import moment from 'moment';

export default class ActivityLogsViewController {
  /* @ngInject */
  constructor($async, UserActivityService, Notifications) {
    this.$async = $async;
    this.UserActivityService = UserActivityService;
    this.Notifications = Notifications;

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
      const offset = (this.state.page - 1) * this.state.limit;
      try {
        const { logs, totalCount } = await this.UserActivityService.logs(offset, this.state.limit, this.state.sort, this.state.keyword, this.state.date);
        this.state.logs = decorateLogs(logs);
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

function decorateLogs(logs) {
  if (!logs || !logs.length) {
    return [];
  }

  return logs.map((log) => ({ ...log, payload: parseJSON(atob(log.payload)) }));
}

function parseJSON(json) {
  try {
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}
