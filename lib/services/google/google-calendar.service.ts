/**
 * Google Calendar Service
 * 
 * Manages Google Calendar events for class scheduling.
 * Integrates with Google Meet for video conferencing.
 * 
 * @see docs/google-meet-calendar/google-meet-calendar.scope.md - CRITICAL AREA #2
 */

import { google } from 'googleapis';
import { googleAuthService } from './google-auth.service';
import { traceLogger } from '@/lib/tracing/trace-logger';
import { v4 as uuidv4 } from 'uuid';

// IANA timezone validation
const VALID_TIMEZONES = Intl.supportedValuesOf('timeZone');

interface OneTimeClassData {
  teacherId: string;
  title: string;
  description: string;
  startTime: Date;
  duration: number;              // Minutes
  timezone: string;
  attendeeEmails: string[];
}

interface RecurringClassData extends OneTimeClassData {
  recurrence: {
    pattern: 'daily' | 'weekly' | 'biweekly' | 'monthly';
    daysOfWeek?: number[];       // [0-6] for weekly (0 = Sunday)
    endDate?: Date;
  };
}

interface CalendarEvent {
  id: string;
  meetLink: string;
  htmlLink: string;
}

export class GoogleCalendarService {
  /**
   * Create one-time calendar event with Google Meet link
   * 
   * @param data - Class data
   * @returns Calendar event with Meet link
   */
  async createOneTimeClass(data: OneTimeClassData): Promise<CalendarEvent> {
    const spanId = traceLogger.startSpan('GoogleCalendar', 'createOneTimeClass');

    try {
      // Validate timezone
      this.validateTimezone(data.timezone);

      // Validate attendee emails
      this.validateEmails(data.attendeeEmails);

      // Get valid access token
      const accessToken = await googleAuthService.getValidAccessToken(data.teacherId);

      // Initialize Calendar API client
      const calendar = google.calendar({ version: 'v3' });
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });

      // Calculate end time
      const endTime = new Date(data.startTime.getTime() + data.duration * 60 * 1000);

      // Create event
      const response = await calendar.events.insert({
        auth,
        calendarId: 'primary',
        conferenceDataVersion: 1,
        requestBody: {
          summary: data.title,
          description: data.description,
          location: 'Google Meet',
          start: {
            dateTime: data.startTime.toISOString(),
            timeZone: data.timezone,
          },
          end: {
            dateTime: endTime.toISOString(),
            timeZone: data.timezone,
          },
          attendees: data.attendeeEmails.map(email => ({ email })),
          conferenceData: {
            createRequest: {
              requestId: uuidv4(),
              conferenceSolutionKey: {
                type: 'hangoutsMeet',
              },
            },
          },
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'email', minutes: 1440 },    // 24 hours before
              { method: 'popup', minutes: 30 },       // 30 minutes before
            ],
          },
        },
      });

      const event = response.data;
      const meetLink = event.conferenceData?.entryPoints?.[0]?.uri || '';

      if (!meetLink) {
        throw new Error('Failed to generate Google Meet link');
      }

      // Log success (domains only, not full emails - GDPR)
      const domains = data.attendeeEmails.map(e => e.split('@')[1]);
      traceLogger.log('info', 'GoogleCalendar', 'One-time class created', {
        eventId: event.id,
        title: data.title,
        startTime: data.startTime.toISOString(),
        duration: data.duration,
        attendeeCount: data.attendeeEmails.length,
        domains: [...new Set(domains)],
      });

      traceLogger.endSpan(spanId, 'success');

      return {
        id: event.id!,
        meetLink,
        htmlLink: event.htmlLink!,
      };
    } catch (error) {
      traceLogger.log('error', 'GoogleCalendar', 'Failed to create one-time class', {
        error: error instanceof Error ? error.message : 'Unknown error',
        teacherId: data.teacherId,
        title: data.title,
      });
      traceLogger.endSpan(spanId, 'error', { message: 'Class creation failed' });
      throw error;
    }
  }

  /**
   * Create recurring calendar event with Google Meet link
   * 
   * @param data - Recurring class data
   * @returns Calendar event with Meet link
   */
  async createRecurringClass(data: RecurringClassData): Promise<CalendarEvent> {
    const spanId = traceLogger.startSpan('GoogleCalendar', 'createRecurringClass');

    try {
      // Validate timezone
      this.validateTimezone(data.timezone);

      // Validate attendee emails
      this.validateEmails(data.attendeeEmails);

      // Validate recurrence pattern
      this.validateRecurrence(data.recurrence);

      // Get valid access token
      const accessToken = await googleAuthService.getValidAccessToken(data.teacherId);

      // Initialize Calendar API client
      const calendar = google.calendar({ version: 'v3' });
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });

      // Calculate end time
      const endTime = new Date(data.startTime.getTime() + data.duration * 60 * 1000);

      // Build RRULE
      const rrule = this.buildRecurrenceRule(data.recurrence);

      // Create event
      const response = await calendar.events.insert({
        auth,
        calendarId: 'primary',
        conferenceDataVersion: 1,
        requestBody: {
          summary: data.title,
          description: data.description,
          location: 'Google Meet',
          start: {
            dateTime: data.startTime.toISOString(),
            timeZone: data.timezone,
          },
          end: {
            dateTime: endTime.toISOString(),
            timeZone: data.timezone,
          },
          recurrence: [rrule],
          attendees: data.attendeeEmails.map(email => ({ email })),
          conferenceData: {
            createRequest: {
              requestId: uuidv4(),
              conferenceSolutionKey: {
                type: 'hangoutsMeet',
              },
            },
          },
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'email', minutes: 1440 },
              { method: 'popup', minutes: 30 },
            ],
          },
        },
      });

      const event = response.data;
      const meetLink = event.conferenceData?.entryPoints?.[0]?.uri || '';

      if (!meetLink) {
        throw new Error('Failed to generate Google Meet link');
      }

      // Log success (domains only)
      const domains = data.attendeeEmails.map(e => e.split('@')[1]);
      traceLogger.log('info', 'GoogleCalendar', 'Recurring class created', {
        eventId: event.id,
        title: data.title,
        startTime: data.startTime.toISOString(),
        duration: data.duration,
        pattern: data.recurrence.pattern,
        rrule,
        attendeeCount: data.attendeeEmails.length,
        domains: [...new Set(domains)],
      });

      traceLogger.endSpan(spanId, 'success');

      return {
        id: event.id!,
        meetLink,
        htmlLink: event.htmlLink!,
      };
    } catch (error) {
      traceLogger.log('error', 'GoogleCalendar', 'Failed to create recurring class', {
        error: error instanceof Error ? error.message : 'Unknown error',
        teacherId: data.teacherId,
        title: data.title,
      });
      traceLogger.endSpan(spanId, 'error', { message: 'Recurring class creation failed' });
      throw error;
    }
  }

  /**
   * Create instant meeting (starts immediately)
   * 
   * @param data - Class data (startTime will be now)
   * @returns Calendar event with Meet link
   */
  async createInstantMeeting(data: Omit<OneTimeClassData, 'startTime'>): Promise<CalendarEvent> {
    const spanId = traceLogger.startSpan('GoogleCalendar', 'createInstantMeeting');

    try {
      const now = new Date();
      const instantClassData: OneTimeClassData = {
        ...data,
        startTime: now,
      };

      traceLogger.log('info', 'GoogleCalendar', 'Creating instant meeting', {
        teacherId: data.teacherId,
        title: data.title,
      });

      const event = await this.createOneTimeClass(instantClassData);

      traceLogger.endSpan(spanId, 'success');
      return event;
    } catch (error) {
      traceLogger.log('error', 'GoogleCalendar', 'Failed to create instant meeting', {
        error: error instanceof Error ? error.message : 'Unknown error',
        teacherId: data.teacherId,
      });
      traceLogger.endSpan(spanId, 'error', { message: 'Instant meeting creation failed' });
      throw error;
    }
  }

  /**
   * Update calendar event
   * 
   * @param teacherId - Teacher's Firebase UID
   * @param eventId - Google Calendar event ID
   * @param updates - Fields to update
   */
  async updateClass(
    teacherId: string,
    eventId: string,
    updates: Partial<OneTimeClassData>
  ): Promise<void> {
    const spanId = traceLogger.startSpan('GoogleCalendar', 'updateClass');

    try {
      const accessToken = await googleAuthService.getValidAccessToken(teacherId);

      const calendar = google.calendar({ version: 'v3' });
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });

      // Get existing event
      const existingEvent = await calendar.events.get({
        auth,
        calendarId: 'primary',
        eventId,
      });

      // Build update payload
      const updatePayload: any = {};

      if (updates.title) updatePayload.summary = updates.title;
      if (updates.description) updatePayload.description = updates.description;
      if (updates.startTime && updates.duration) {
        const endTime = new Date(updates.startTime.getTime() + updates.duration * 60 * 1000);
        updatePayload.start = {
          dateTime: updates.startTime.toISOString(),
          timeZone: updates.timezone || 'UTC',
        };
        updatePayload.end = {
          dateTime: endTime.toISOString(),
          timeZone: updates.timezone || 'UTC',
        };
      }
      if (updates.attendeeEmails) {
        this.validateEmails(updates.attendeeEmails);
        updatePayload.attendees = updates.attendeeEmails.map(email => ({ email }));
      }

      // Update event
      await calendar.events.patch({
        auth,
        calendarId: 'primary',
        eventId,
        requestBody: updatePayload,
      });

      traceLogger.log('info', 'GoogleCalendar', 'Class updated', {
        eventId,
        updatedFields: Object.keys(updatePayload),
      });

      traceLogger.endSpan(spanId, 'success');
    } catch (error) {
      traceLogger.log('error', 'GoogleCalendar', 'Failed to update class', {
        error: error instanceof Error ? error.message : 'Unknown error',
        teacherId,
        eventId,
      });
      traceLogger.endSpan(spanId, 'error', { message: 'Class update failed' });
      throw error;
    }
  }

  /**
   * Cancel calendar event
   * 
   * @param teacherId - Teacher's Firebase UID
   * @param eventId - Google Calendar event ID
   */
  async cancelClass(teacherId: string, eventId: string): Promise<void> {
    const spanId = traceLogger.startSpan('GoogleCalendar', 'cancelClass');

    try {
      const accessToken = await googleAuthService.getValidAccessToken(teacherId);

      const calendar = google.calendar({ version: 'v3' });
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });

      // Delete event (sends cancellation emails to attendees)
      await calendar.events.delete({
        auth,
        calendarId: 'primary',
        eventId,
        sendUpdates: 'all',
      });

      traceLogger.log('info', 'GoogleCalendar', 'Class cancelled', {
        eventId,
      });

      traceLogger.endSpan(spanId, 'success');
    } catch (error) {
      traceLogger.log('error', 'GoogleCalendar', 'Failed to cancel class', {
        error: error instanceof Error ? error.message : 'Unknown error',
        teacherId,
        eventId,
      });
      traceLogger.endSpan(spanId, 'error', { message: 'Class cancellation failed' });
      throw error;
    }
  }

  /**
   * Validate timezone string
   */
  private validateTimezone(timezone: string): void {
    if (!VALID_TIMEZONES.includes(timezone)) {
      throw new Error(`Invalid timezone: ${timezone}`);
    }
  }

  /**
   * Validate email addresses
   */
  private validateEmails(emails: string[]): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const email of emails) {
      if (!emailRegex.test(email)) {
        throw new Error(`Invalid email: ${email}`);
      }
    }
  }

  /**
   * Validate recurrence pattern
   */
  private validateRecurrence(recurrence: RecurringClassData['recurrence']): void {
    if (!['daily', 'weekly', 'biweekly', 'monthly'].includes(recurrence.pattern)) {
      throw new Error(`Invalid recurrence pattern: ${recurrence.pattern}`);
    }

    if (recurrence.pattern === 'weekly' && (!recurrence.daysOfWeek || recurrence.daysOfWeek.length === 0)) {
      throw new Error('Weekly recurrence requires daysOfWeek');
    }

    if (recurrence.endDate && recurrence.endDate <= new Date()) {
      throw new Error('End date must be in the future');
    }
  }

  /**
   * Build RRULE string for recurrence
   */
  private buildRecurrenceRule(recurrence: RecurringClassData['recurrence']): string {
    let rrule = '';

    switch (recurrence.pattern) {
      case 'daily':
        rrule = 'RRULE:FREQ=DAILY';
        break;
      case 'weekly':
        if (!recurrence.daysOfWeek) throw new Error('Weekly recurrence requires daysOfWeek');
        const dayNames = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
        const byDay = recurrence.daysOfWeek.map(d => dayNames[d]).join(',');
        rrule = `RRULE:FREQ=WEEKLY;BYDAY=${byDay}`;
        break;
      case 'biweekly':
        if (!recurrence.daysOfWeek) throw new Error('Biweekly recurrence requires daysOfWeek');
        const biweeklyDayNames = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
        const biweeklyByDay = recurrence.daysOfWeek.map(d => biweeklyDayNames[d]).join(',');
        rrule = `RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=${biweeklyByDay}`;
        break;
      case 'monthly':
        rrule = 'RRULE:FREQ=MONTHLY';
        break;
    }

    if (recurrence.endDate) {
      const until = recurrence.endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      rrule += `;UNTIL=${until}`;
    }

    return rrule;
  }
}

// Singleton instance
export const googleCalendarService = new GoogleCalendarService();
