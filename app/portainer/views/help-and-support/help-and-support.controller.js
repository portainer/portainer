const MatomoCategories = Object.freeze({
  ADMIN: 'Admin',
  STANDARD: 'Non-admin',
  GETTING_STARTED: 'Getting Started Page',
});
// TO REMOVE
void MatomoCategories;

const MatomoActions = Object.freeze({
  ADMIN: 'admin',
  ENGINEER: 'platform',
  DEVELOPER: 'dev',
  YOUTUBE: 'portainertube',
  ENTER: 'getting-started-help&support',
  SKIP: 'getting-started-skip',
  DONE: 'getting-started-done',
});

const links = {
  admin: {
    linkId: 'admin',
    image: require('@/assets/images/help-links/admin.png'),
    imageAltText: 'Portainer admin setup',
    redirectUrl: 'https://portainer.io/inapp/ceadmin',
    description: 'Admin - Setting up Portainer',
    matomoAction: MatomoActions.ADMIN,
  },
  engineer: {
    linkId: 'engineer',
    image: require('@/assets/images/help-links/platform_engineer.png'),
    imageAltText: 'Platform engineer',
    redirectUrl: 'https://portainer.io/inapp/ceplatform',
    description: 'A Platform Engineer Experience',
    matomoAction: MatomoActions.ENGINEER,
  },
  developer: {
    linkId: 'developer',
    image: require('@/assets/images/help-links/developer.png'),
    imageAltText: 'Developer',
    redirectUrl: 'https://portainer.io/inapp/cedev',
    description: 'A Developer Experience',
    matomoAction: MatomoActions.DEVELOPER,
  },
  youtube: {
    linkId: 'youtube',
    image: require('@/assets/images/help-links/youtube.png'),
    imageAltText: 'Youtube',
    redirectUrl: 'https://www.youtube.com/c/portainerio',
    description: 'Portainer.io Youtube Channel',
    matomoAction: MatomoActions.YOUTUBE,
  },
};

class HelpAndSupportController {
  /* @ngInject */
  constructor($async, $state, clipboard, Authentication) {
    this.$async = $async;
    this.$state = $state;
    this.clipboard = clipboard;
    this.Authentication = Authentication;

    this.copyLink = this.copyLink.bind(this);
    this.onLinkClicked = this.onLinkClicked.bind(this);

    this.links = links;
    this.state = {
      firstLogin: false,
      linkClicked: false,
    };
  }

  copyLink(link, linkId) {
    this.clipboard.copyText(link);
    $(`#copy${linkId}Notification`).show().fadeOut(2500);
  }

  onLinkClicked(matomoAction) {
    void matomoAction;

    this.state.linkClicked = true;
    // send matomo event
  }

  closeHelpView() {
    // send matomo event
    const initFirstEndpoint = this.$transition$.params().initFirstEndpoint;

    if (this.state.firstLogin && this.isAdmin && initFirstEndpoint) {
      return this.$state.go('portainer.init.endpoint');
    }
    return this.$state.go('portainer.home');
  }

  $onInit() {
    this.isAdmin = this.Authentication.isAdmin();
    this.state.firstLogin = this.$transition$.params().firstLogin;
    // send matomo event
  }
}

export default HelpAndSupportController;
