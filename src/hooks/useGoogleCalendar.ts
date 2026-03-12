import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { APP_URL } from '@/lib/constants';

const GOOGLE_CALENDAR_SCOPES = 'https://www.googleapis.com/auth/calendar.events';

interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
}

export function useGoogleCalendar() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Check if Google Calendar is connected
  const checkConnection = useCallback(async () => {
    if (!user) return false;
    
    try {
      // Check if user has Google provider linked
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      
      if (session?.provider_token) {
        setAccessToken(session.provider_token);
        setIsConnected(true);
        return true;
      }
      
      setIsConnected(false);
      return false;
    } catch (error) {
      console.error('Error checking Google connection:', error);
      return false;
    }
  }, [user]);

  // Connect Google Calendar via OAuth
  const connectGoogleCalendar = useCallback(async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${APP_URL}/profile/settings`,
          scopes: GOOGLE_CALENDAR_SCOPES,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        toast.error(error.message);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error connecting Google Calendar:', error);
      toast.error('Failed to connect Google Calendar');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Disconnect Google Calendar
  const disconnectGoogleCalendar = useCallback(async () => {
    setAccessToken(null);
    setIsConnected(false);
    toast.success('Google Calendar disconnected');
  }, []);

  // Create event in Google Calendar
  const createEvent = useCallback(async (event: GoogleCalendarEvent): Promise<boolean> => {
    if (!accessToken) {
      toast.error('Please connect Google Calendar first');
      return false;
    }

    try {
      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create event');
      }

      toast.success('Event added to Google Calendar');
      return true;
    } catch (error) {
      console.error('Error creating Google Calendar event:', error);
      toast.error('Failed to add event to Google Calendar');
      return false;
    }
  }, [accessToken]);

  // Sync habit to Google Calendar
  const syncHabit = useCallback(async (habit: {
    id: string;
    name: string;
    icon: string;
    targetDays: number[];
    period?: { startDate?: string; endDate?: string };
  }) => {
    if (!accessToken) {
      toast.error('Please connect Google Calendar first');
      return false;
    }

    // Create events for the period
    const startDate = habit.period?.startDate || new Date().toISOString().split('T')[0];
    const endDate = habit.period?.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const event: GoogleCalendarEvent = {
      summary: `${habit.icon} ${habit.name}`,
      description: 'Habit from Top-Focus',
      start: { date: startDate },
      end: { date: startDate },
    };

    return createEvent(event);
  }, [accessToken, createEvent]);

  // Sync task to Google Calendar
  const syncTask = useCallback(async (task: {
    id: string;
    name: string;
    icon: string;
    dueDate: string;
    dueTime?: string;
    description?: string;
  }) => {
    if (!accessToken) {
      toast.error('Please connect Google Calendar first');
      return false;
    }

    const event: GoogleCalendarEvent = {
      summary: `${task.icon} ${task.name}`,
      description: task.description || 'Task from Top-Focus',
      start: task.dueTime 
        ? { dateTime: `${task.dueDate}T${task.dueTime}:00`, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }
        : { date: task.dueDate },
      end: task.dueTime 
        ? { dateTime: `${task.dueDate}T${task.dueTime}:00`, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }
        : { date: task.dueDate },
    };

    return createEvent(event);
  }, [accessToken, createEvent]);

  return {
    isConnected,
    loading,
    checkConnection,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    syncHabit,
    syncTask,
    createEvent,
  };
}