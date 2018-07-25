angular.module('portainer.docker')
.controller('ContainerCapabilitiesController', [
function () {
  var ctrl = this;

  this.$onInit = function() {
    // all capabilities can be found at https://docs.docker.com/engine/reference/run/#runtime-privilege-and-linux-capabilities
    ctrl.capabilities = [
      {capability: 'SETPCAP', description: 'Modify process capabilities.', allowed: true},
      {capability: 'MKNOD', description: 'Create special files using mknod(2).', allowed: true},
      {capability: 'AUDIT_WRITE', description: 'Write records to kernel auditing log.', allowed: true},
      {capability: 'CHOWN', description: 'Make arbitrary changes to file UIDs and GIDs (see chown(2)).', allowed: true},
      {capability: 'NET_RAW', description: 'Use RAW and PACKET sockets.', allowed: true},
      {capability: 'DAC_OVERRIDE', description: 'Bypass file read, write, and execute permission checks.', allowed: true},
      {capability: 'FOWNER', description: 'Bypass permission checks on operations that normally require the file system UID of the process to match the UID of the file.', allowed: true},
      {capability: 'FSETID', description: 'Don’t clear set-user-ID and set-group-ID permission bits when a file is modified.', allowed: true},
      {capability: 'KILL', description: 'Bypass permission checks for sending signals.', allowed: true},
      {capability: 'SETGID', description: 'Make arbitrary manipulations of process GIDs and supplementary GID list.', allowed: true},
      {capability: 'SETUID', description: 'Make arbitrary manipulations of process UIDs.', allowed: true},
      {capability: 'NET_BIND_SERVICE', description: 'Bind a socket to internet domain privileged ports (port numbers less than 1024).', allowed: true},
      {capability: 'SYS_CHROOT', description: 'Use chroot(2), change root directory.', allowed: true},
      {capability: 'SETFCAP', description: 'Set file capabilities.', allowed: true},

      {capability: 'SYS_MODULE', description: 'Load and unload kernel modules.', allowed: false},
      {capability: 'SYS_RAWIO', description: 'Perform I/O port operations (iopl(2) and ioperm(2)).', allowed: false},
      {capability: 'SYS_PACCT', description: 'Use acct(2), switch process accounting on or off.', allowed: false},
      {capability: 'SYS_ADMIN', description: 'Perform a range of system administration operations.', allowed: false},
      {capability: 'SYS_NICE', description: 'Raise process nice value (nice(2), setpriority(2)) and change the nice value for arbitrary processes.', allowed: false},
      {capability: 'SYS_RESOURCE', description: 'Override resource Limits.', allowed: false},
      {capability: 'SYS_TIME', description: 'Set system clock (settimeofday(2), stime(2), adjtimex(2)); set real-time (hardware) clock.', allowed: false},
      {capability: 'SYS_TTY_CONFIG', description: 'Use vhangup(2); employ various privileged ioctl(2) operations on virtual terminals.', allowed: false},
      {capability: 'AUDIT_CONTROL', description: 'Enable and disable kernel auditing; change auditing filter rules; retrieve auditing status and filtering rules.', allowed: false},
      {capability: 'MAC_ADMIN', description: 'Allow MAC configuration or state changes. Implemented for the Smack LSM.', allowed: false},
      {capability: 'MAC_OVERRIDE', description: 'Override Mandatory Access Control (MAC). Implemented for the Smack Linux Security Module (LSM).', allowed: false},
      {capability: 'NET_ADMIN', description: 'Perform various network-related operations.', allowed: false},
      {capability: 'SYSLOG', description: 'Perform privileged syslog(2) operations.', allowed: false},
      {capability: 'DAC_READ_SEARCH', description: 'Bypass file read permission checks and directory read and execute permission checks.', allowed: false},
      {capability: 'LINUX_IMMUTABLE', description: 'Set the FS_APPEND_FL and FS_IMMUTABLE_FL i-node flags.', allowed: false},
      {capability: 'NET_BROADCAST', description: 'Make socket broadcasts, and listen to multicasts.', allowed: false},
      {capability: 'IPC_LOCK', description: 'Lock memory (mlock(2), mlockall(2), mmap(2), shmctl(2)).', allowed: false},
      {capability: 'IPC_OWNER', description: 'Bypass permission checks for operations on System V IPC objects.', allowed: false},
      {capability: 'SYS_PTRACE', description: 'Trace arbitrary processes using ptrace(2).', allowed: false},
      {capability: 'SYS_BOOT', description: 'Use reboot(2) and kexec_load(2), reboot and load a new kernel for later execution.', allowed: false},
      {capability: 'LEASE', description: 'Establish leases on arbitrary files (see fcntl(2)).', allowed: false},
      {capability: 'WAKE_ALARM', description: 'Trigger something that will wake up the system.', allowed: false},
      {capability: 'BLOCK_SUSPEND', description: 'Employ features that can block system suspend.', allowed: false}
    ];
  };
}]);
