// general icons

import dataflow from '@/assets/ico/dataflow-1.svg?c';
import git from '@/assets/ico/git.svg?c';
import kube from '@/assets/ico/kube.svg?c';
import ldap from '@/assets/ico/ldap.svg?c';
import linux from '@/assets/ico/linux.svg?c';
import memory from '@/assets/ico/memory.svg?c';
import restorewindow from '@/assets/ico/restore-window.svg?c';
import route from '@/assets/ico/route.svg?c';
import sort from '@/assets/ico/sort.svg?c';
import subscription from '@/assets/ico/subscription.svg?c';
import Placeholder from '@/assets/ico/placeholder.svg?c'; // Placeholder is used when an icon name cant be matched
// vendor icons
import aws from '@/assets/ico/vendor/aws.svg?c';
import azure from '@/assets/ico/vendor/azure.svg?c';
import civo from '@/assets/ico/vendor/civo.svg?c';
import digitalocean from '@/assets/ico/vendor/digitalocean.svg?c';
import docker from '@/assets/ico/vendor/docker.svg?c';
import dockericon from '@/assets/ico/vendor/docker-icon.svg?c';
import dockercompose from '@/assets/ico/vendor/docker-compose.svg?c';
import ecr from '@/assets/ico/vendor/ecr.svg?c';
import github from '@/assets/ico/vendor/github.svg?c';
import gitlab from '@/assets/ico/vendor/gitlab.svg?c';
import google from '@/assets/ico/vendor/google.svg?c';
import googlecloud from '@/assets/ico/vendor/googlecloud.svg?c';
import kubernetes from '@/assets/ico/vendor/kubernetes.svg?c';
import helm from '@/assets/ico/vendor/helm.svg?c';
import akamai from '@/assets/ico/vendor/akamai.svg?c';
import microsoft from '@/assets/ico/vendor/microsoft.svg?c';
import microsofticon from '@/assets/ico/vendor/microsoft-icon.svg?c';
import openldap from '@/assets/ico/vendor/openldap.svg?c';
import proget from '@/assets/ico/vendor/proget.svg?c';
import quay from '@/assets/ico/vendor/quay.svg?c';

const placeholder = Placeholder;

export const SvgIcons = {
  dataflow,
  dockericon,
  git,
  ldap,
  linux,
  memory,
  placeholder,
  restorewindow,
  route,
  sort,
  subscription,
  aws,
  azure,
  civo,
  digitalocean,
  docker,
  dockercompose,
  ecr,
  github,
  gitlab,
  google,
  googlecloud,
  kubernetes,
  helm,
  akamai,
  microsoft,
  microsofticon,
  openldap,
  proget,
  quay,
  kube,
};

interface SvgProps {
  icon: keyof typeof SvgIcons;
  className?: string;
}

function Svg({ icon, className }: SvgProps) {
  const SvgIcon = SvgIcons[icon];

  if (!SvgIcon) {
    return (
      <span className={className} aria-hidden="true">
        <Placeholder />
      </span>
    );
  }

  return (
    <span className={className} aria-hidden="true">
      <SvgIcon />
    </span>
  );
}

export default Svg;
