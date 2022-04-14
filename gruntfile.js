const os = require('os');
const loadGruntTasks = require('load-grunt-tasks');
const webpackDevConfig = require('./webpack/webpack.develop');
const webpackProdConfig = require('./webpack/webpack.production');
const webpackTestingConfig = require('./webpack/webpack.testing');

let arch = os.arch();
if (arch === 'x64') {
  arch = 'amd64';
}

module.exports = function (grunt) {
  loadGruntTasks(grunt, {
    pattern: ['grunt-*', 'gruntify-*'],
  });

  grunt.initConfig({
    root: 'dist',
    distdir: 'dist/public',
    binaries: {
      dockerLinuxVersion: '19.03.13',
      dockerWindowsVersion: '19-03-12',
      dockerLinuxComposeVersion: '1.27.4',
      dockerWindowsComposeVersion: '1.28.0',
      dockerComposePluginVersion: '2.0.0-rc.2',
      helmVersion: 'v3.8.0',
      komposeVersion: 'v1.22.0',
      kubectlVersion: 'v1.18.0',
    },
    env: gruntConfig.env,
    clean: gruntConfig.clean,
    shell: gruntConfig.shell,
    webpack: gruntConfig.webpack,
  });

  grunt.registerTask('lint', ['eslint']);

  grunt.registerTask('build:server', [`shell:build_binary:linux:${arch}`, `download_binaries:linux:${arch}`]);

  grunt.registerTask('build:client', ['webpack:dev']);

  grunt.registerTask('build', ['build:server', 'build:client']);

  grunt.registerTask('start:server', ['build:server', 'shell:run_container']);

  grunt.registerTask('start:localserver', [`shell:build_binary:linux:${arch}`, 'shell:run_localserver']);

  grunt.registerTask('start:client', ['shell:install_yarndeps', 'webpack:devWatch']);

  grunt.registerTask('start', ['start:server', 'start:client']);

  grunt.registerTask('start:toolkit', ['start:localserver', 'start:client']);

  grunt.task.registerTask('release', 'release:<platform>:<arch>', function (platform = 'linux', a = arch) {
    grunt.task.run(['env:prod', 'clean:all', `shell:build_binary:${platform}:${a}`, `download_binaries:${platform}:${a}`, 'webpack:prod']);
  });

  grunt.task.registerTask('devopsbuild', 'devopsbuild:<platform>:<arch>:<env>', function (platform, a = arch, env = 'prod') {
    grunt.task.run([
      `env:${env}`,
      'clean:all',
      `shell:build_binary_azuredevops:${platform}:${a}`,
      `download_binaries:${platform}:${a}`,
      `webpack:${env}`,
      `shell:storybook:${env}`,
    ]);
  });

  grunt.task.registerTask('download_binaries', 'download_binaries:<platform>:<arch>', function (platform = 'linux', a = arch) {
    grunt.task.run([
      `shell:download_docker_binary:${platform}:${a}`,
      `shell:download_docker_compose_binary:${platform}:${a}`,
      `shell:download_helm_binary:${platform}:${a}`,
      `shell:download_kompose_binary:${platform}:${a}`,
      `shell:download_kubectl_binary:${platform}:${a}`,
    ]);
  });
};

/***/
const gruntConfig = {};

gruntConfig.env = {
  dev: {
    NODE_ENV: 'development',
  },
  prod: {
    NODE_ENV: 'production',
  },
  testing: {
    NODE_ENV: 'testing',
  },
};

gruntConfig.webpack = {
  dev: webpackDevConfig,
  devWatch: Object.assign({ watch: true }, webpackDevConfig),
  prod: webpackProdConfig,
  testing: webpackTestingConfig,
};

gruntConfig.clean = {
  server: ['<%= root %>/portainer'],
  client: ['<%= distdir %>/*'],
  all: ['<%= root %>/*'],
};

gruntConfig.shell = {
  build_binary: { command: shell_build_binary },
  build_binary_azuredevops: { command: shell_build_binary_azuredevops },
  download_docker_binary: { command: shell_download_docker_binary },
  download_kompose_binary: { command: shell_download_kompose_binary },
  download_kubectl_binary: { command: shell_download_kubectl_binary },
  download_helm_binary: { command: shell_download_helm_binary },
  download_docker_compose_binary: { command: shell_download_docker_compose_binary },
  run_container: { command: shell_run_container },
  run_localserver: { command: shell_run_localserver, options: { async: true } },
  install_yarndeps: { command: shell_install_yarndeps },
  storybook: { command: shell_storybook },
};

function shell_storybook(env) {
  if (env === 'production') {
    return '';
  }

  return `
    yarn build-storybook
  `;
}

function shell_build_binary(platform, arch) {
  const binfile = 'dist/portainer';
  if (platform === 'linux' || platform === 'darwin') {
    return `
      if [ -f ${binfile} ]; then
        echo "Portainer binary exists";
      else
        build/build_binary.sh ${platform} ${arch};
      fi
    `;
  }

  // windows
  return `
      powershell -Command "& {if (Get-Item -Path ${binfile}.exe -ErrorAction:SilentlyContinue) {
        Write-Host "Portainer binary exists"
      } else {
        & ".\\build\\build_binary.ps1" -platform ${platform} -arch ${arch}
      }}"
    `;
}

function shell_build_binary_azuredevops(platform, arch) {
  return `build/build_binary_azuredevops.sh ${platform} ${arch};`;
}

function shell_run_container() {
  const portainerData = '${PORTAINER_DATA:-/tmp/portainer}';
  const portainerRoot = process.env.PORTAINER_PROJECT ? process.env.PORTAINER_PROJECT : process.env.PWD;
  const portainerFlags = '${PORTAINER_FLAGS:-}';

  return `
    docker rm -f portainer
    docker run -d \
      -p 8000:8000 \
      -p 9000:9000 \
      -p 9443:9443 \
      -v ${portainerRoot}/dist:/app \
      -v ${portainerData}:/data \
      -v /var/run/docker.sock:/var/run/docker.sock:z \
      -v /var/run/docker.sock:/var/run/alternative.sock:z \
      -v /tmp:/tmp \
      --name portainer \
      portainer/base \
      /app/portainer ${portainerFlags}
  `;
}

function shell_run_localserver() {
  return './dist/portainer';
}

function shell_install_yarndeps() {
  return 'yarn';
}

function shell_download_docker_binary(platform, arch) {
  const ps = { windows: 'win', darwin: 'mac' };
  const as = { amd64: 'x86_64', arm: 'armhf', arm64: 'aarch64' };

  const ip = ps[platform] === undefined ? platform : ps[platform];
  const ia = as[arch] === undefined ? arch : as[arch];
  const binaryVersion = platform === 'windows' ? '<%= binaries.dockerWindowsVersion %>' : '<%= binaries.dockerLinuxVersion %>';

  return `
    if [ -f dist/docker ] || [ -f dist/docker.exe ]; then
      echo "docker binary exists";
    else
      build/download_docker_binary.sh ${ip} ${ia} ${binaryVersion};
    fi
  `;
}

function shell_download_docker_compose_binary(p, a) {
  var ps = { windows: 'win', darwin: 'mac' };
  var as = { arm: 'armhf', arm64: 'aarch64' };
  var ip = ps[p] || p;
  var ia = as[a] || a;
  var binaryVersion = p === 'windows' ? '<%= binaries.dockerWindowsComposeVersion %>' : '<%= binaries.dockerLinuxComposeVersion %>';

  // plugin
  if (p === 'linux' && a !== 'amd64') {
    if (a === 'arm64') {
      ia = 'arm64';
    }

    if (a === 'arm') {
      ia = 'armv7';
    }
    binaryVersion = '<%= binaries.dockerComposePluginVersion %>';
  }

  return `
    if [ -f dist/docker-compose ] || [ -f dist/docker-compose.exe ] || [ -f dist/docker-compose.plugin ] || [ -f dist/docker-compose.plugin.exe ]; then
      echo "Docker Compose binary exists";
    else
      build/download_docker_compose_binary.sh ${ip} ${ia} ${binaryVersion};
    fi`;
}

function shell_download_helm_binary(platform, arch) {
  var binaryVersion = '<%= binaries.helmVersion %>';

  return `
    if [ -f dist/helm ] || [ -f dist/helm.exe ]; then
    echo "helm binary exists";
    else
      build/download_helm_binary.sh ${platform} ${arch} ${binaryVersion};
    fi
  `;
}

function shell_download_kompose_binary(platform, arch) {
  const binaryVersion = '<%= binaries.komposeVersion %>';

  return `
    if [ -f dist/kompose ] || [ -f dist/kompose.exe ]; then
      echo "kompose binary exists";
    else
      build/download_kompose_binary.sh ${platform} ${arch} ${binaryVersion};
    fi
  `;
}

function shell_download_kubectl_binary(platform, arch) {
  var binaryVersion = '<%= binaries.kubectlVersion %>';

  return `
    if [ -f dist/kubectl ] || [ -f dist/kubectl.exe ]; then
      echo "kubectl binary exists";
    else
      build/download_kubectl_binary.sh ${platform} ${arch} ${binaryVersion};
    fi
  `;
}
