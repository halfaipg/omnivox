import 'dotenv/config';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load calendar-specific environment variables
dotenv.config({ path: '.env.calendar' });

// Microsoft Graph API endpoints
const MS_GRAPH_BASE_URL = 'https://graph.microsoft.com/v1.0';
const TOKEN_ENDPOINT = 'https://login.microsoftonline.com/aipowergrid.io/oauth2/v2.0/token';

// Cache for access tokens and availability data
let accessTokenCache = null;
let accessTokenExpiry = 0;
if (!global.msCalendarResponseCache) {
  global.msCalendarResponseCache = new Map();
}

/**
 * Get an access token for Microsoft Graph API
 * @returns {Promise<string>} - Access token
 */
async function getAccessToken() {
  // Check if we have a valid cached token
  const now = Date.now();
  if (accessTokenCache && accessTokenExpiry > now) {
    return accessTokenCache;
  }

  try {
    const response = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.MS_CLIENT_ID,
        client_secret: process.env.MS_CLIENT_SECRET,
        refresh_token: process.env.MS_REFRESH_TOKEN,
        scope: 'offline_access Calendars.ReadWrite',
        grant_type: 'refresh_token',
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Failed to get access token: ${data.error_description || data.error}`);
    }

    // Cache the token and set expiry (subtract 5 minutes for safety)
    accessTokenCache = data.access_token;
    accessTokenExpiry = now + (data.expires_in * 1000) - (5 * 60 * 1000);
    
    return accessTokenCache;
  } catch (error) {
    console.error('Error getting Microsoft access token:', error);
    throw error;
  }
}

/**
 * Get available time slots for a given date range
 * @param {Date} startDate - Start date for availability check
 * @param {Date} endDate - End date for availability check
 * @param {number} durationMinutes - Duration of the meeting in minutes
 * @returns {Promise<Array>} - Array of available time slots
 */
export async function getAvailableTimeSlots(startDate, endDate, durationMinutes = 30) {
  try {
    console.time('getAvailableTimeSlots');
    
    // Simple in-memory cache using a combination of dates and duration as key
    const cacheKey = `ms_${startDate.toISOString()}_${endDate.toISOString()}_${durationMinutes}`;
    
    // Check if we have cached results
    if (global.msCalendarResponseCache.has(cacheKey)) {
      console.log('Using cached Microsoft calendar availability data');
      console.timeEnd('getAvailableTimeSlots');
      return global.msCalendarResponseCache.get(cacheKey);
    }
    
    // Get busy times from Microsoft Calendar
    const busyTimes = await getBusyTimes(startDate, endDate);
    console.log(`Retrieved ${busyTimes.length} busy time slots from Microsoft calendar`);
    
    // Define working hours (9 AM to 5 PM Eastern Time)
    const workingHoursStart = 9; // 9 AM Eastern
    const workingHoursEnd = 17;  // 5 PM Eastern
    
    // Generate all possible time slots
    const allTimeSlots = generateTimeSlots(startDate, endDate, durationMinutes, workingHoursStart, workingHoursEnd);
    console.log(`Generated ${allTimeSlots.length} possible time slots`);
    
    // Filter out busy time slots
    const availableSlots = filterAvailableSlots(allTimeSlots, busyTimes, durationMinutes);
    console.log(`Filtered to ${availableSlots.length} available time slots`);
    
    // Store in cache with 5-minute expiration
    global.msCalendarResponseCache.set(cacheKey, availableSlots);
    setTimeout(() => {
      if (global.msCalendarResponseCache.has(cacheKey)) {
        global.msCalendarResponseCache.delete(cacheKey);
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    console.timeEnd('getAvailableTimeSlots');
    return availableSlots;
  } catch (error) {
    console.error('Error getting available time slots from Microsoft calendar:', error);
    throw error;
  }
}

/**
 * Get busy times from Microsoft Calendar using getSchedule API
 * @param {Date} startDate - Start date for availability check
 * @param {Date} endDate - End date for availability check
 * @returns {Promise<Array>} - Array of busy time slots
 */
async function getBusyTimes(startDate, endDate) {
  try {
    const token = await getAccessToken();
    
    // Format dates for Microsoft Graph API
    const formattedStartTime = startDate.toISOString();
    const formattedEndTime = endDate.toISOString();
    
    // Get the user email from environment variables
    const userEmail = process.env.MS_USER_EMAIL;
    
    // Call Microsoft Graph getSchedule API
    const response = await fetch(`${MS_GRAPH_BASE_URL}/users/${userEmail}/calendar/getSchedule`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'outlook.timezone="America/New_York"'
      },
      body: JSON.stringify({
        Schedules: [userEmail],
        StartTime: {
          dateTime: formattedStartTime,
          timeZone: 'America/New_York'
        },
        EndTime: {
          dateTime: formattedEndTime,
          timeZone: 'America/New_York'
        },
        availabilityViewInterval: '30' // 30-minute intervals
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Failed to get schedule: ${data.error ? data.error.message : 'Unknown error'}`);
    }
    
    // Process the schedule information
    if (data.value && data.value.length > 0) {
      const scheduleInfo = data.value[0];
      const busySlots = [];
      
      // Process schedule items (existing appointments)
      if (scheduleInfo.scheduleItems && scheduleInfo.scheduleItems.length > 0) {
        scheduleInfo.scheduleItems.forEach(item => {
          // Only include busy or tentative items
          if (item.status === 'Busy' || item.status === 'Tentative' || item.status === 'OutOfOffice') {
            busySlots.push({
              start: item.start.dateTime,
              end: item.end.dateTime
            });
          }
        });
      }
      
      return busySlots;
    }
    
    return [];
  } catch (error) {
    console.error('Error getting busy times from Microsoft calendar:', error);
    throw error;
  }
}

/**
 * Generate all possible time slots for a date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {number} durationMinutes - Duration of each slot in minutes
 * @param {number} workingHoursStart - Start of working hours (e.g., 9 for 9 AM)
 * @param {number} workingHoursEnd - End of working hours (e.g., 17 for 5 PM)
 * @returns {Array} - Array of time slots
 */
function generateTimeSlots(startDate, endDate, durationMinutes, workingHoursStart, workingHoursEnd) {
  console.time('generateTimeSlots');
  const slots = [];
  const currentDate = new Date(startDate);
  const timeZone = 'America/New_York'; // Use Eastern Time
  
  // Calculate the number of slots per day
  const slotsPerDay = Math.floor((workingHoursEnd - workingHoursStart) * 60 / durationMinutes);
  
  // Set time to working hours start
  currentDate.setHours(workingHoursStart, 0, 0, 0);
  
  // Pre-calculate the milliseconds for duration
  const durationMs = durationMinutes * 60 * 1000;
  
  // Loop through each day
  while (currentDate < endDate) {
    // Skip weekends (0 = Sunday, 6 = Saturday)
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // Create day start and end times once
      const dayStart = new Date(currentDate);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(workingHoursEnd, 0, 0, 0);
      
      // Generate all slots for the day in a more efficient way
      let slotStart = dayStart;
      for (let i = 0; i < slotsPerDay; i++) {
        const slotEnd = new Date(slotStart.getTime() + durationMs);
        
        if (slotEnd <= dayEnd) {
          slots.push({
            start: new Date(slotStart),
            end: new Date(slotEnd)
          });
        }
        
        // Move to next slot
        slotStart = new Date(slotStart.getTime() + durationMs);
      }
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
    currentDate.setHours(workingHoursStart, 0, 0, 0);
  }
  
  console.timeEnd('generateTimeSlots');
  return slots;
}

/**
 * Filter available slots by removing busy times
 * @param {Array} allSlots - All possible time slots
 * @param {Array} busyTimes - Busy time slots from calendar
 * @param {number} durationMinutes - Duration of each slot in minutes
 * @returns {Array} - Available time slots
 */
function filterAvailableSlots(allSlots, busyTimes, durationMinutes) {
  console.time('filterAvailableSlots');
  
  // If no busy times, return all slots
  if (!busyTimes || busyTimes.length === 0) {
    console.timeEnd('filterAvailableSlots');
    return allSlots;
  }
  
  // Convert busy times to Date objects once
  const busyTimeRanges = busyTimes.map(busy => ({
    start: new Date(busy.start),
    end: new Date(busy.end)
  }));
  
  // Filter slots
  const availableSlots = allSlots.filter(slot => {
    // Check if this slot overlaps with any busy time
    return !busyTimeRanges.some(busy => {
      // Check for overlap
      return (
        (slot.start >= busy.start && slot.start < busy.end) || // Slot starts during busy time
        (slot.end > busy.start && slot.end <= busy.end) || // Slot ends during busy time
        (slot.start <= busy.start && slot.end >= busy.end) // Slot completely contains busy time
      );
    });
  });
  
  console.timeEnd('filterAvailableSlots');
  return availableSlots;
}

/**
 * Create a calendar event in Microsoft Calendar
 * @param {Object} eventDetails - Event details
 * @returns {Promise<Object>} - Created event
 */
export async function createCalendarEvent(eventDetails) {
  try {
    const token = await getAccessToken();
    
    // Get the user email from environment variables
    const userEmail = process.env.MS_USER_EMAIL;
    
    // Prepare the event data
    const event = {
      subject: eventDetails.summary || 'Meeting',
      body: {
        contentType: 'HTML',
        content: eventDetails.description || ''
      },
      start: {
        dateTime: eventDetails.startTime,
        timeZone: 'America/New_York'
      },
      end: {
        dateTime: eventDetails.endTime,
        timeZone: 'America/New_York'
      },
      attendees: Array.isArray(eventDetails.attendees) ? eventDetails.attendees.map(attendee => ({
        emailAddress: {
          address: typeof attendee === 'string' ? attendee : (attendee.email || ''),
          name: attendee.name || (typeof attendee === 'string' ? attendee : (attendee.email || ''))
        },
        type: 'required'
      })) : [],
      isOnlineMeeting: true,
      onlineMeetingProvider: 'teamsForBusiness'
    };
    
    // Create the event
    const response = await fetch(`${MS_GRAPH_BASE_URL}/users/${userEmail}/calendar/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Failed to create event: ${data.error ? data.error.message : 'Unknown error'}`);
    }
    
    // Format the response to match the Google Calendar format
    return {
      id: data.id,
      status: data.status,
      htmlLink: data.webLink,
      created: data.createdDateTime,
      updated: data.lastModifiedDateTime,
      summary: data.subject,
      description: data.bodyPreview,
      creator: {
        email: data.organizer.emailAddress.address,
        displayName: data.organizer.emailAddress.name,
        self: true
      },
      organizer: {
        email: data.organizer.emailAddress.address,
        displayName: data.organizer.emailAddress.name,
        self: true
      },
      start: {
        dateTime: data.start.dateTime,
        timeZone: data.start.timeZone
      },
      end: {
        dateTime: data.end.dateTime,
        timeZone: data.end.timeZone
      },
      attendees: data.attendees.map(attendee => ({
        email: attendee.emailAddress.address,
        responseStatus: attendee.status.response
      })),
      onlineMeeting: data.isOnlineMeeting ? {
        joinUrl: data.onlineMeeting?.joinUrl,
        conferenceId: data.onlineMeeting?.conferenceId,
        tollNumber: data.onlineMeeting?.tollNumber
      } : null
    };
  } catch (error) {
    console.error('Error creating Microsoft calendar event:', error);
    throw error;
  }
} 