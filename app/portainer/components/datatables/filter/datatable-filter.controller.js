export default class DatatableFilterController {
  isEnabled() {
    return 0 < this.state.length && this.state.length < this.labels.length;
  }

  onChangeItem(filterValue) {
    if (this.isChecked(filterValue)) {
      return this.onChange(
        this.filterKey,
        this.state.filter((v) => v !== filterValue)
      );
    }
    return this.onChange(this.filterKey, [...this.state, filterValue]);
  }

  isChecked(filterValue) {
    return this.state.includes(filterValue);
  }
}
