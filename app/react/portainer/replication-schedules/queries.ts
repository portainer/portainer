import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/portainer/services/axios';
import { ReplicationSchedule } from './types';

export function useReplicationSchedules() {
  return useQuery<ReplicationSchedule[]>(['replicationSchedules'], async () => {
    const { data } = await axios.get<ReplicationSchedule[]>('/replication_schedules');
    return data;
  });
}

export function useReplicationSchedule(id: string, options?: { enabled?: boolean }) {
  return useQuery<ReplicationSchedule>(['replicationSchedules', id], async () => {
    const { data } = await axios.get<ReplicationSchedule>(`/replication_schedules/${id}`);
    return data;
  }, options);
}

export function useCreateReplicationSchedule() {
  const queryClient = useQueryClient();
  return useMutation(
    async (payload: Partial<ReplicationSchedule>) => {
      const { data } = await axios.post<ReplicationSchedule>('/replication_schedules', payload);
      return data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['replicationSchedules']);
      },
    }
  );
}

export function useUpdateReplicationSchedule() {
  const queryClient = useQueryClient();
  return useMutation(
    async ({ id, ...payload }: Partial<ReplicationSchedule> & { id: number }) => {
      const { data } = await axios.put<ReplicationSchedule>(`/replication_schedules/${id}`, payload);
      return data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['replicationSchedules']);
      },
    }
  );
}

export function useDeleteReplicationSchedule() {
  const queryClient = useQueryClient();
  return useMutation(
    async (id: number) => {
      await axios.delete(`/replication_schedules/${id}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['replicationSchedules']);
      },
    }
  );
}
