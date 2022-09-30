// theme icons
import automode from '@/assets/ico/theme/auto.svg?c';
import darkmode from '@/assets/ico/theme/darkmode.svg?c';
import lightmode from '@/assets/ico/theme/lightmode.svg?c';
import highcontrastmode from '@/assets/ico/theme/highcontrastmode.svg?c';
// wizard icons
import agent from '@/assets/ico/wizard/agent.svg?c';
import api from '@/assets/ico/wizard/api.svg?c';
import edgeagent from '@/assets/ico/wizard/edge-agent.svg?c';
import cloudimport from '@/assets/ico/wizard/import.svg?c';
import socket from '@/assets/ico/wizard/socket.svg?c';
// general icons
import arrowsupdown from '@/assets/ico/arrows-updown.svg?c';
import arrowright from '@/assets/ico/arrow-right-long.svg?c';
import bomb from '@/assets/ico/bomb.svg?c';
import checked from '@/assets/ico/checked.svg?c';
import circlenotch from '@/assets/ico/circle-notch.svg?c';
import clockrewind from '@/assets/ico/clock-rewind.svg?c';
import compress from '@/assets/ico/compress.svg?c';
import cubes from '@/assets/ico/cubes.svg?c';
import custom from '@/assets/ico/custom.svg?c';
import dataflow from '@/assets/ico/dataflow-1.svg?c';
import dataflow2 from '@/assets/ico/dataflow-2.svg?c';
import expand from '@/assets/ico/expand.svg?c';
import filecode from '@/assets/ico/file-code.svg?c';
import filesignature from '@/assets/ico/file-signature.svg?c';
import fileupload from '@/assets/ico/file-upload.svg?c';
import flask from '@/assets/ico/flask.svg?c';
import git from '@/assets/ico/git.svg?c';
import hacker from '@/assets/ico/hacker.svg?c';
import heartbeat from '@/assets/ico/heartbeat.svg?c';
import laptop from '@/assets/ico/laptop.svg?c';
import laptopcode from '@/assets/ico/laptop-code.svg?c';
import ldap from '@/assets/ico/ldap.svg?c';
import magic from '@/assets/ico/magic.svg?c';
import magicwand from '@/assets/ico/magic-wand.svg?c';
import memory from '@/assets/ico/memory.svg?c';
import objectgroup from '@/assets/ico/object-group.svg?c';
import palette from '@/assets/ico/palette.svg?c';
import plug from '@/assets/ico/plug.svg?c';
import restore from '@/assets/ico/restore.svg?c';
import restorewindow from '@/assets/ico/restore-window.svg?c';
import rocket from '@/assets/ico/rocket.svg?c';
import route from '@/assets/ico/route.svg?c';
import share from '@/assets/ico/share.svg?c';
import sort from '@/assets/ico/sort.svg?c';
import tachometer from '@/assets/ico/tachometer.svg?c';
import template from '@/assets/ico/template.svg?c';
import tag from '@/assets/ico/tag-2.svg?c';
import tag2 from '@/assets/ico/tags.svg?c';
import tools from '@/assets/ico/tools.svg?c';
import upload from '@/assets/ico/upload.svg?c';
import url from '@/assets/ico/url.svg?c';
import usercircle from '@/assets/ico/user-circle.svg?c';
import userlock from '@/assets/ico/user-lock.svg?c';
import Placeholder from '@/assets/ico/placeholder.svg?c'; // Placeholder is used when an icon name cant be matched
// vendor icons
import aws from '@/assets/ico/vendor/aws.svg?c';
import azure from '@/assets/ico/vendor/azure.svg?c';
import civo from '@/assets/ico/vendor/civo.svg?c';
import digitalocean from '@/assets/ico/vendor/digitalocean.svg?c';
import docker from '@/assets/ico/vendor/docker.svg?c';
import dockercompose from '@/assets/ico/vendor/docker-compose.svg?c';
import ecr from '@/assets/ico/vendor/ecr.svg?c';
import github from '@/assets/ico/vendor/github.svg?c';
import gitlab from '@/assets/ico/vendor/gitlab.svg?c';
import google from '@/assets/ico/vendor/google.svg?c';
import googlecloud from '@/assets/ico/vendor/googlecloud.svg?c';
import kubernetes from '@/assets/ico/vendor/kubernetes.svg?c';
import helm from '@/assets/ico/vendor/helm.svg?c';
import linode from '@/assets/ico/vendor/linode.svg?c';
import microsoft from '@/assets/ico/vendor/microsoft.svg?c';
import nomad from '@/assets/ico/vendor/nomad.svg?c';
import openldap from '@/assets/ico/vendor/openldap.svg?c';
import proget from '@/assets/ico/vendor/proget.svg?c';
import quay from '@/assets/ico/vendor/quay.svg?c';
import internal from '@/assets/ico/vendor/internal.svg?c';

const placeholder = Placeholder;

export const SvgIcons = {
  agent,
  api,
  edgeagent,
  cloudimport,
  socket,
  automode,
  darkmode,
  lightmode,
  highcontrastmode,
  dataflow,
  dataflow2,
  arrowsupdown,
  arrowright,
  bomb,
  checked,
  circlenotch,
  clockrewind,
  compress,
  cubes,
  custom,
  expand,
  filecode,
  filesignature,
  fileupload,
  flask,
  git,
  hacker,
  heartbeat,
  laptop,
  laptopcode,
  ldap,
  magic,
  magicwand,
  memory,
  objectgroup,
  palette,
  placeholder,
  plug,
  restore,
  restorewindow,
  rocket,
  route,
  share,
  sort,
  tachometer,
  template,
  tag,
  tag2,
  tools,
  upload,
  url,
  usercircle,
  userlock,
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
  linode,
  microsoft,
  nomad,
  openldap,
  proget,
  quay,
  internal,
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
