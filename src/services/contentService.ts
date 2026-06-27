import { apiClient } from '@/api/client';
import { env } from '@/config/env';
import { sleep } from '@/lib/utils';
import { SUBJECTS } from '@/services/mock/subjects';
import {
  MOCK_BOOKINGS,
  MOCK_CONVERSATIONS,
  MOCK_MESSAGES,
  MOCK_NOTIFICATIONS,
  PLATFORM_STATS,
} from '@/services/mock/misc';
import type { Booking, Conversation, Message, Notification, Stat, Subject } from '@/types';

export const contentService = {
  async subjects(): Promise<Subject[]> {
    if (env.useMocks) {
      await sleep(200);
      return SUBJECTS;
    }
    const { data } = await apiClient.get<Subject[]>('/subjects');
    return data;
  },
  async stats(): Promise<Stat[]> {
    if (env.useMocks) {
      await sleep(150);
      return PLATFORM_STATS;
    }
    const { data } = await apiClient.get<Stat[]>('/stats');
    return data;
  },
  async bookings(): Promise<Booking[]> {
    if (env.useMocks) {
      await sleep(300);
      return MOCK_BOOKINGS;
    }
    const { data } = await apiClient.get<Booking[]>('/bookings');
    return data;
  },
  async conversations(): Promise<Conversation[]> {
    if (env.useMocks) {
      await sleep(250);
      return MOCK_CONVERSATIONS;
    }
    const { data } = await apiClient.get<Conversation[]>('/conversations');
    return data;
  },
  async messages(conversationId: string): Promise<Message[]> {
    if (env.useMocks) {
      await sleep(200);
      return MOCK_MESSAGES.filter((m) => m.conversationId === conversationId);
    }
    const { data } = await apiClient.get<Message[]>(`/conversations/${conversationId}/messages`);
    return data;
  },
  async notifications(): Promise<Notification[]> {
    if (env.useMocks) {
      await sleep(200);
      return MOCK_NOTIFICATIONS;
    }
    const { data } = await apiClient.get<Notification[]>('/notifications');
    return data;
  },
};
