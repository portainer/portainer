import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/portainer/services/axios';
import { BackupSchedule } from './types';

export function useBackupSchedules() {
  return useQuery<BackupSchedule[]>(['backupSchedules'], async () => {
    const { data } = await axios.get<BackupSchedule[]>('/backup_schedules');
    return data;
  });
}

export function useBackupSchedule(id: string, options?: { enabled?: boolean }) {
  return useQuery<BackupSchedule>(['backupSchedules', id], async () => {
    const { data } = await axios.get<BackupSchedule>(`/backup_schedules/${id}`);
    return data;
  }, options);
}

export function useCreateBackupSchedule() {
  const queryClient = useQueryClient();
  return useMutation(
    async (payload: Partial<BackupSchedule>) => {
      const { data } = await axios.post<BackupSchedule>('/backup_schedules', payload);
      return data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['backupSchedules']);
      },
    }
  );
}

export function useUpdateBackupSchedule() {
  const queryClient = useQueryClient();
  return useMutation(
    async ({ id, ...payload }: Partial<BackupSchedule> & { id: number }) => {
      const { data } = await axios.put<BackupSchedule>(`/backup_schedules/${id}`, payload);
      return data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['backupSchedules']);
      },
    }
  );
}

export function useDeleteBackupSchedule() {
  const queryClient = useQueryClient();
  return useMutation(
    async (id: number) => {
      await axios.delete(`/backup_schedules/${id}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['backupSchedules']);
      },
    }
  );
}
