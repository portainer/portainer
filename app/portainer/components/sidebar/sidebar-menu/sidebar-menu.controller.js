class SidebarMenuController {
  /* @ngInject */
  constructor($state) {
    this.$state = $state;

    this.state = {
      forceOpen: false,
    };
  }

  isOpen() {
    if (!this.isSidebarOpen) {
      return false;
    }

    if (this.state.forceOpen) {
      return true;
    }

    return this.isOpenByPathState();
  }

  isOpenByPathState() {
    const currentName = this.$state.current.name;
    return currentName.startsWith(this.path) || this.childrenPaths.includes(currentName);
  }

  onClickArrow(event) {
    event.stopPropagation();
    event.preventDefault();

    // prevent toggling when menu is open by state
    if (this.isOpenByPathState()) {
      return;
    }

    this.state.forceOpen = !this.state.forceOpen;
  }

  $onInit() {
    this.childrenPaths = this.childrenPaths || [];
  }
}

export default SidebarMenuController;
