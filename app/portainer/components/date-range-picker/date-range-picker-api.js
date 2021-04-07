import moment from 'moment';

const applyEvent = 'apply.daterangepicker';
const cancelEvent = 'cancel.daterangepicker';
const hideEvent = 'hide.daterangepicker';

export class DateRangePickerApi {
  constructor(element, $scope, options) {
    this.el = element;
    this.$scope = $scope;
    this.options = options;

    this.startDate = null;
    this.endDate = null;
    this.maxDate = null;
    this.minDate = null;
  }

  build() {
    const { el, $scope } = this;

    return {
      setMinDate: (x) => {
        if (typeof x === 'object') {
          return;
        }

        const datePicker = el.data('daterangepicker');

        datePicker.minDate = x;
        datePicker.updateView();
        datePicker.updateCalendars();
        this.minDate = moment.unix(x);

        if (this.startDate && this.startDate.isBefore(this.minDate)) {
          this.startDate = this.minDate;
          $scope.startDate = x;
        }

        if (this.endDate && this.endDate.isBefore(this.minDate)) {
          this.endDate = this.minDate;
          $scope.endDate = x;
        }
      },

      setMaxDate: (x) => {
        if (typeof x === 'object') {
          return;
        }

        const datePicker = el.data('daterangepicker');

        datePicker.maxDate = x;
        datePicker.updateView();
        datePicker.updateCalendars();
        this.maxDate = moment.unix(x);

        if (this.startDate && this.startDate.isAfter(this.maxDate)) {
          $scope.startDate = 0;
          this.startDate = null;
        }

        if (this.endDate && this.endDate.isAfter(this.maxDate)) {
          $scope.endDate = 0;
          this.endDate = null;
        }

        this.clearInput();
      },

      setStartDate: (x) => {
        if (typeof x === 'object') {
          return;
        }

        el.data('daterangepicker').setStartDate(x);
        this.startDate = moment.unix(x);
      },

      setEndDate: (x) => {
        if (typeof x === 'object') {
          return;
        }

        el.data('daterangepicker').setEndDate(x);
        this.endDate = moment.unix(x);
      },

      isSingle: () => {
        el.data('daterangepicker').singleDatePicker;
      },

      show: () => {
        el.data('daterangepicker').show();
      },

      hide: () => {
        el.data('daterangepicker').hide();
      },
    };
  }

  onApply(event, api) {
    this.startDate = api.startDate;
    this.endDate = this.isSingle() ? api.startDate : api.endDate;

    if (this.$scope.formCtrl && this.$scope.ngRequired) {
      if (this.$scope.startDate && this.$scope.endDate) {
        this.$scope.formCtrl.$setValidity(this.$scope.dateRangePickerId, true);
      } else {
        this.$scope.formCtrl.$setValidity(this.$scope.dateRangePickerId, false);
      }
    }

    if (this.$scope.onChange) {
      this.$scope.$apply(() => {
        this.$scope.onChange({ startDate: api.startDate.unix(), endDate: api.endDate.unix() });
      });
    }
  }

  onCancel() {
    if (this.$scope.clearOnCancel) {
      return;
    }

    this.$scope.$apply(() => {
      if (this.$scope.formCtrl && this.$scope.ngRequired) {
        this.$scope.formCtrl.$setValidity(this.$scope.dateRangePickerId, false);
      }

      this.clearInput();
      if (this.$scope.onChange) {
        this.$scope.onChange({ startDate: 0, endDate: 0 });
      }
    });
  }

  onHide() {
    setInterval(() => {
      if ((this.isSingle() && !this.$scope.startDate) || (!this.$scope.startDate && !this.$scope.endDate)) {
        this.clearInput();
      }
    });
  }

  clearInput() {
    $(this.el).val('');
  }

  isSingle() {
    return this.options.singleDatePicker;
  }

  init() {
    this.el.on(applyEvent, (event, api) => {
      this.onApply(event, api);
    });

    this.el.on(cancelEvent, (event, api) => {
      this.onCancel(event, api);
    });

    this.el.on(hideEvent, (event, api) => {
      this.onHide(event, api);
    });
  }

  destroy() {
    this.el.off(applyEvent);
    this.el.off(cancelEvent);
    this.el.off(hideEvent);
  }
}
