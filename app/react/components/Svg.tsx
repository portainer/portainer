import lightmode from '@/assets/ico/theme/lightmode.svg?c';
import darkmode from '@/assets/ico/theme/darkmode.svg?c';
import highcontrastmode from '@/assets/ico/theme/highcontrastmode.svg?c';
import automode from '@/assets/ico/theme/auto.svg?c';
import git from '@/assets/icons/git-logo.svg?c';
import aws from '@/assets/ico/vendor/aws.svg?c';
import azure from '@/assets/ico/vendor/azure.svg?c';
import civo from '@/assets/ico/vendor/civo.svg?c';
import digitalocean from '@/assets/ico/vendor/digitalocean.svg?c';
import docker from '@/assets/ico/vendor/docker.svg?c';
import dockercompose from '@/assets/ico/vendor/dockercompose.svg?c';
import ecr from '@/assets/ico/vendor/ecr.svg?c';
import github from '@/assets/ico/vendor/github.svg?c';
import gitlab from '@/assets/ico/vendor/gitlab.svg?c';
import google from '@/assets/ico/vendor/google.svg?c';
import googlecloud from '@/assets/ico/vendor/googlecloud.svg?c';
import kubernetes from '@/assets/ico/vendor/kubernetes.svg?c';
import linode from '@/assets/ico/vendor/linode.svg?c';
import microsoft from '@/assets/ico/vendor/microsoft.svg?c';
import nomad from '@/assets/ico/vendor/nomad.svg?c';
import openldap from '@/assets/ico/vendor/openldap.svg?c';
import proget from '@/assets/ico/vendor/proget.svg?c';
import quay from '@/assets/ico/vendor/quay.svg?c';

export const SvgIcons = {
  lightmode,
  darkmode,
  highcontrastmode,
  automode,
  git,
  aws,
  civo,
  azure,
  digitalocean,
  docker,
  dockercompose,
  ecr,
  github,
  gitlab,
  google,
  googlecloud,
  kubernetes,
  linode,
  microsoft,
  nomad,
  openldap,
  proget,
  quay,
};

interface SvgProps {
  icon: keyof typeof SvgIcons;
  className?: string;
}

function Svg({ icon, className }: SvgProps) {
  const SvgIcon = SvgIcons[icon];
  return (
    <span className={className}>
      <SvgIcon />
    </span>
  );
}

export default Svg;
