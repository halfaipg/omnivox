import { google } from 'googleapis';
import 'dotenv/config';

// Setup Google Calendar API
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

/**
 * Get free time slots for a given date range
 * @param {Date} startDate - Start date for availability check
 * @param {Date} endDate - End date for availability check
 * @param {number} durationMinutes - Duration of the meeting in minutes
 * @returns {Promise<Array>} - Array of available time slots
 */
export async function getAvailableTimeSlots(startDate, endDate, durationMinutes = 30) {
  try {
    console.time('getAvailableTimeSlots');
    
    // Simple in-memory cache using a combination of dates and duration as key
    const cacheKey = `${startDate.toISOString()}_${endDate.toISOString()}_${durationMinutes}`;
    
    // Check if we have cached results
    if (global.availabilityCacheMap && global.availabilityCacheMap.has(cacheKey)) {
      console.log('Using cached availability data');
      console.timeEnd('getAvailableTimeSlots');
      return global.availabilityCacheMap.get(cacheKey);
    }
    
    // Get busy times from Google Calendar
    const busyTimes = await getBusyTimes(startDate, endDate);
    console.log(`Retrieved ${busyTimes.length} busy time slots from calendar`);
    
    // Define working hours (9 AM to 5 PM Eastern Time)
    const workingHoursStart = 9; // 9 AM Eastern
    const workingHoursEnd = 17;  // 5 PM Eastern
    
    // Generate all possible time slots
    const allTimeSlots = generateTimeSlots(startDate, endDate, durationMinutes, workingHoursStart, workingHoursEnd);
    console.log(`Generated ${allTimeSlots.length} possible time slots`);
    
    // Filter out busy time slots
    const availableSlots = filterAvailableSlots(allTimeSlots, busyTimes, durationMinutes);
    console.log(`Filtered to ${availableSlots.length} available time slots`);
    
    // Cache the results
    if (!global.availabilityCacheMap) {
      global.availabilityCacheMap = new Map();
    }
    
    // Store in cache with 5-minute expiration
    global.availabilityCacheMap.set(cacheKey, availableSlots);
    setTimeout(() => {
      if (global.availabilityCacheMap && global.availabilityCacheMap.has(cacheKey)) {
        global.availabilityCacheMap.delete(cacheKey);
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    console.timeEnd('getAvailableTimeSlots');
    return availableSlots;
  } catch (error) {
    console.error('Error getting available time slots:', error);
    throw error;
  }
}

/**
 * Get busy times from Google Calendar
 * @param {Date} startDate - Start date for availability check
 * @param {Date} endDate - End date for availability check
 * @returns {Promise<Array>} - Array of busy time slots
 */
async function getBusyTimes(startDate, endDate) {
  try {
    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        items: [{ id: 'primary' }]
      }
    });
    
    return response.data.calendars.primary.busy;
  } catch (error) {
    console.error('Error getting busy times:', error);
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
 * Group available slots by day and time of day (morning, afternoon)
 * @param {Array} availableSlots - Available time slots
 * @returns {Object} - Grouped time slots by day and time of day
 */
export function groupAvailableSlotsByDay(availableSlots) {
  console.time('groupAvailableSlotsByDay');
  const groupedSlots = {};
  
  // Pre-initialize the structure for better performance
  const uniqueDates = new Set();
  availableSlots.forEach(slot => {
    uniqueDates.add(slot.start.toISOString().split('T')[0]);
  });
  
  // Initialize the structure for all dates
  uniqueDates.forEach(date => {
    groupedSlots[date] = {
      morning: [],
      afternoon: [],
      evening: []
    };
  });
  
  // Now group the slots
  availableSlots.forEach(slot => {
    const date = slot.start.toISOString().split('T')[0];
    const hour = slot.start.getHours();
    
    // Determine time of day (Eastern Time)
    let timeOfDay;
    if (hour < 12) {
      timeOfDay = 'morning';
    } else if (hour < 17) {
      timeOfDay = 'afternoon';
    } else {
      timeOfDay = 'evening';
    }
    
    // Add slot to appropriate time of day
    groupedSlots[date][timeOfDay].push(slot);
  });
  
  console.timeEnd('groupAvailableSlotsByDay');
  return groupedSlots;
}

/**
 * Format available days and times for voice response
 * @param {Object} groupedSlots - Grouped time slots by day and time of day
 * @returns {Object} - Formatted availability for voice response
 */
export function formatAvailabilityForVoice(groupedSlots) {
  const availableDays = Object.keys(groupedSlots);
  
  if (availableDays.length === 0) {
    return {
      availabilityText: "I don't have any availability in the requested time range.",
      availableDays: []
    };
  }
  
  const formattedDays = availableDays.map(dateStr => {
    const date = new Date(dateStr);
    // Format the date in Eastern Time
    const options = { 
      timeZone: 'America/New_York',
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    };
    const formattedDate = date.toLocaleDateString('en-US', options);
    
    const daySlots = groupedSlots[dateStr];
    const timeOfDayAvailable = [];
    
    if (daySlots.morning.length > 0) timeOfDayAvailable.push('morning');
    if (daySlots.afternoon.length > 0) timeOfDayAvailable.push('afternoon');
    if (daySlots.evening.length > 0) timeOfDayAvailable.push('evening');
    
    return {
      date: dateStr,
      formattedDate,
      timeOfDayAvailable,
      slots: daySlots
    };
  });
  
  // The availabilityText will be generated in the server.js file
  // after the formattedDate values are corrected
  
  return {
    availabilityText: "", // This will be set in server.js
    availableDays: formattedDays
  };
}

/**
 * Create a calendar event
 * @param {Object} eventDetails - Event details
 * @returns {Promise<Object>} - Created event
 */
export async function createCalendarEvent(eventDetails) {
  try {
    const event = {
      summary: eventDetails.summary || 'Meeting',
      description: eventDetails.description || '',
      start: {
        dateTime: eventDetails.startTime,
        timeZone: 'America/New_York',
      },
      end: {
        dateTime: eventDetails.endTime,
        timeZone: 'America/New_York',
      },
      attendees: eventDetails.attendees || [],
      reminders: {
        useDefault: true,
      },
    };
    
    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      sendUpdates: 'all',
    });
    
    return response.data;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
} 