export interface Capability {
  key: string;
  description: string;
  default?: boolean;
}

const capDesc: Array<Capability> = [
  {
    key: 'SETPCAP',
    description: 'Modify process capabilities.',
    default: true,
  },
  {
    key: 'MKNOD',
    description: 'Create special files using mknod(2).',
    default: true,
  },
  {
    key: 'AUDIT_WRITE',
    description: 'Write records to kernel auditing log.',
    default: true,
  },
  {
    key: 'CHOWN',
    description: 'Make arbitrary changes to file UIDs and GIDs (see chown(2)).',
    default: true,
  },
  {
    key: 'NET_RAW',
    description: 'Use RAW and PACKET sockets.',
    default: true,
  },
  {
    key: 'DAC_OVERRIDE',
    description: 'Bypass file read, write, and execute permission checks.',
    default: true,
  },
  {
    key: 'FOWNER',
    description:
      'Bypass permission checks on operations that normally require the file system UID of the process to match the UID of the file.',
    default: true,
  },
  {
    key: 'FSETID',
    description:
      'Don’t clear set-user-ID and set-group-ID permission bits when a file is modified.',
    default: true,
  },
  {
    key: 'KILL',
    description: 'Bypass permission checks for sending signals.',
    default: true,
  },
  {
    key: 'SETGID',
    description:
      'Make arbitrary manipulations of process GIDs and supplementary GID list.',
    default: true,
  },
  {
    key: 'SETUID',
    description: 'Make arbitrary manipulations of process UIDs.',
    default: true,
  },
  {
    key: 'NET_BIND_SERVICE',
    description:
      'Bind a socket to internet domain privileged ports (port numbers less than 1024).',
    default: true,
  },
  {
    key: 'SYS_CHROOT',
    description: 'Use chroot(2), change root directory.',
    default: true,
  },
  {
    key: 'SETFCAP',
    description: 'Set file capabilities.',
    default: true,
  },
  {
    key: 'SYS_MODULE',
    description: 'Load and unload kernel modules.',
  },
  {
    key: 'SYS_RAWIO',
    description: 'Perform I/O port operations (iopl(2) and ioperm(2)).',
  },
  {
    key: 'SYS_PACCT',
    description: 'Use acct(2), switch process accounting on or off.',
  },
  {
    key: 'SYS_ADMIN',
    description: 'Perform a range of system administration operations.',
  },
  {
    key: 'SYS_NICE',
    description:
      'Raise process nice value (nice(2), setpriority(2)) and change the nice value for arbitrary processes.',
  },
  {
    key: 'SYS_RESOURCE',
    description: 'Override resource Limits.',
  },
  {
    key: 'SYS_TIME',
    description:
      'Set system clock (settimeofday(2), stime(2), adjtimex(2)); set real-time (hardware) clock.',
  },
  {
    key: 'SYS_TTY_CONFIG',
    description:
      'Use vhangup(2); employ various privileged ioctl(2) operations on virtual terminals.',
  },
  {
    key: 'AUDIT_CONTROL',
    description:
      'Enable and disable kernel auditing; change auditing filter rules; retrieve auditing status and filtering rules.',
  },
  {
    key: 'MAC_ADMIN',
    description:
      'Allow MAC configuration or state changes. Implemented for the Smack LSM.',
  },
  {
    key: 'MAC_OVERRIDE',
    description:
      'Override Mandatory Access Control (MAC). Implemented for the Smack Linux Security Module (LSM).',
  },
  {
    key: 'NET_ADMIN',
    description: 'Perform various network-related operations.',
  },
  {
    key: 'SYSLOG',
    description: 'Perform privileged syslog(2) operations.',
  },
  {
    key: 'DAC_READ_SEARCH',
    description:
      'Bypass file read permission checks and directory read and execute permission checks.',
  },
  {
    key: 'LINUX_IMMUTABLE',
    description: 'Set the FS_APPEND_FL and FS_IMMUTABLE_FL i-node flags.',
  },
  {
    key: 'NET_BROADCAST',
    description: 'Make socket broadcasts, and listen to multicasts.',
  },
  {
    key: 'IPC_LOCK',
    description: 'Lock memory (mlock(2), mlockall(2), mmap(2), shmctl(2)).',
  },
  {
    key: 'IPC_OWNER',
    description:
      'Bypass permission checks for operations on System V IPC objects.',
  },
  {
    key: 'SYS_PTRACE',
    description: 'Trace arbitrary processes using ptrace(2).',
  },
  {
    key: 'SYS_BOOT',
    description:
      'Use reboot(2) and kexec_load(2), reboot and load a new kernel for later execution.',
  },
  {
    key: 'LEASE',
    description: 'Establish leases on arbitrary files (see fcntl(2)).',
  },
  {
    key: 'WAKE_ALARM',
    description: 'Trigger something that will wake up the system.',
  },
  {
    key: 'BLOCK_SUSPEND',
    description: 'Employ features that can block system suspend.',
  },
];

export const capabilities = capDesc.sort((a, b) => (a.key < b.key ? -1 : 1));
