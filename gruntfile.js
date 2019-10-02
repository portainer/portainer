const webpackDevConfig = require('./webpack/webpack.develop');
const webpackProdConfig = require('./webpack/webpack.production');
var loadGruntTasks = require('load-grunt-tasks');

var os = require('os');
var arch = os.arch();
if (arch === 'x64') arch = 'amd64';

var portainer_data = '/tmp/portainer';

module.exports = function(grunt) {
  loadGruntTasks(grunt, {
    pattern: ['grunt-*', 'gruntify-*']
  });

  grunt.initConfig({
    root: 'dist',
    distdir: 'dist/public',
    shippedDockerVersion: '18.09.3',
    shippedDockerVersionWindows: '17.09.0-ce',
    config: gruntfile_cfg.config,
    env: gruntfile_cfg.env,
    src: gruntfile_cfg.src,
    clean: gruntfile_cfg.clean,
    eslint: gruntfile_cfg.eslint,
    shell: gruntfile_cfg.shell,
    copy: gruntfile_cfg.copy,
    webpack: gruntfile_cfg.webpack
  });

  grunt.registerTask('lint', ['eslint']);

  grunt.registerTask('build:server', [
    'shell:build_binary:linux:' + arch,
    'shell:download_docker_binary:linux:' + arch,
  ]);

  grunt.registerTask('build:client', [
    'config:dev',
    'env:dev',
    'webpack:dev'
  ]);

  grunt.registerTask('build', [
    'build:server',
    'build:client',
    'copy:templates'
  ]);

  grunt.registerTask('start:server', [
    'build:server',
    'copy:templates',
    'shell:run_container'
  ]);

  grunt.registerTask('start:client', [
    'config:dev',
    'env:dev',
    'webpack:devWatch'
  ]);

  grunt.registerTask('start', [
    'start:server',
    'start:client'
  ]);

  grunt.task.registerTask('release', 'release:<platform>:<arch>',
    function (p = 'linux', a = arch) {
      grunt.task.run([
        'config:prod',
        'env:prod',
        'clean:all',
        'copy:templates',
        'shell:build_binary:' + p + ':' + a,
        'shell:download_docker_binary:' + p + ':' + a,
        'webpack:prod'
      ]);
    });

  grunt.task.registerTask('devopsbuild', 'devopsbuild:<platform>:<arch>',
    function(p, a) {
      grunt.task.run([
        'config:prod',
        'env:prod',
        'clean:all',
        'copy:templates',
        'shell:build_binary_azuredevops:' + p + ':' + a,
        'shell:download_docker_binary:' + p + ':' + a,
        'webpack:prod'
      ]);
    });
};

/***/
var gruntfile_cfg = {};

gruntfile_cfg.env = {
  dev: {
    NODE_ENV: 'development'
  },
  prod: {
    NODE_ENV: 'production'
  }
};

gruntfile_cfg.webpack = {
  dev: webpackDevConfig,
  devWatch: Object.assign({ watch: true }, webpackDevConfig),
  prod: webpackProdConfig
};

gruntfile_cfg.config = {
  dev: { options: { variables: { environment: 'development' } } },
  prod: { options: { variables: { environment: 'production' } } }
};

gruntfile_cfg.src = {
  js: ['app/**/__module.js', 'app/**/*.js', '!app/**/*.spec.js'],
  jsTpl: ['<%= distdir %>/templates/**/*.js'],
  html: ['index.html'],
  tpl: ['app/**/*.html'],
  css: ['assets/css/app.css', 'app/**/*.css']
};

gruntfile_cfg.clean = {
  server: ['<%= root %>/portainer'],
  client: ['<%= distdir %>/*'],
  docker: ['<%= root %>/docker'],
  all: ['<%= root %>/*'],
};

gruntfile_cfg.eslint = {
  src: ['gruntfile.js', '<%= src.js %>'],
  options: { configFile: '.eslintrc.yml' }
};

gruntfile_cfg.copy = {
  templates: {
    files: [
      {
        dest: '<%= root %>/',
        src: 'templates.json',
        cwd: ''
      }
    ]
  }
};

gruntfile_cfg.shell = {
  build_binary: { command: shell_build_binary },
  build_binary_azuredevops: { command: shell_build_binary_azuredevops },
  download_docker_binary: { command: shell_download_docker_binary },
  run_container: { command: shell_run_container }
};

function shell_build_binary(p, a) {
  var binfile = 'dist/portainer';
  if (p === 'linux') {
    return [
      'if [ -f ' + (binfile) + ' ]; then',
      'echo "Portainer binary exists";',
      'else',
      'build/build_binary.sh ' + p + ' ' + a + ';',
      'fi'
    ].join(' ');
  } else {
    return [
      'powershell -Command "& {if (Get-Item -Path ' + binfile + '.exe -ErrorAction:SilentlyContinue) {',
      'Write-Host "Portainer binary exists"',
      '} else {',
      '& ".\\build\\build_binary.ps1" -platform ' + p + ' -arch ' + a + '',
      '}}"'
    ].join(' ');
  }
}

function shell_build_binary_azuredevops(p, a) {
  if (p === 'linux') {
    return 'build/build_binary_azuredevops.sh ' + p + ' ' + a + ';';
  } else {
    return 'powershell -Command ".\\build\\build_binary_azuredevops.ps1 -platform ' + p + ' -arch ' + a + '"';
  }
}

function shell_run_container() {
  return [
    'docker rm -f portainer',
    'docker run -d -p 8000:8000 -p 9000:9000 -v $(pwd)/dist:/app -v ' + portainer_data + ':/data -v /var/run/docker.sock:/var/run/docker.sock:z --name portainer portainer/base /app/portainer --no-analytics --template-file /app/templates.json'
  ].join(';');
}

function shell_download_docker_binary(p, a) {
  var ps = { 'windows': 'win', 'darwin': 'mac' };
  var as = { 'amd64': 'x86_64', 'arm': 'armhf', 'arm64': 'aarch64' };
  var ip = ((ps[p] === undefined) ? p : ps[p]);
  var ia = ((as[a] === undefined) ? a : as[a]);
  var binaryVersion = ((p === 'windows' ? '<%= shippedDockerVersionWindows %>' : '<%= shippedDockerVersion %>'));
  if (p === 'linux' || p === 'mac') {
    return [
      'if [ -f dist/docker ]; then',
      'echo "Docker binary exists";',
      'else',
      'build/download_docker_binary.sh ' + ip + ' ' + ia + ' ' + binaryVersion + ';',
      'fi'
    ].join(' ');
  } else {
    return [
      'powershell -Command "& {if (Get-Item -Path dist/docker.exe -ErrorAction:SilentlyContinue) {',
      'Write-Host "Docker binary exists"',
      '} else {',
      '& ".\\build\\download_docker_binary.ps1" -docker_version ' + binaryVersion + '',
      '}}"'
    ].join(' ');
  }
}
