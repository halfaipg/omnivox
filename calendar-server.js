import express from 'express';
import 'dotenv/config';
import { getAvailableTimeSlots, groupAvailableSlotsByDay, formatAvailabilityForVoice, createCalendarEvent } from './utils/google-calendar.js';

const app = express();
app.use(express.json());

// Calendar availability endpoint
app.get('/api/calendar/availability', async (req, res) => {
  try {
    console.log('Received request for calendar availability');
    
    // Get date range from query params or use default (next 7 days)
    const startDate = req.query.startDate 
      ? new Date(req.query.startDate) 
      : new Date();
    
    let endDate = req.query.endDate 
      ? new Date(req.query.endDate) 
      : new Date();
    
    // If no end date provided, set to 7 days from start
    if (!req.query.endDate) {
      endDate.setDate(startDate.getDate() + 7);
    }
    
    console.log(`Checking availability from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    // Get meeting duration from query params or use default (30 minutes)
    const durationMinutes = parseInt(req.query.duration || 30);
    
    // Get available time slots
    const availableSlots = await getAvailableTimeSlots(startDate, endDate, durationMinutes);
    console.log(`Found ${availableSlots.length} available time slots`);
    
    // Group slots by day and time of day
    const groupedSlots = groupAvailableSlotsByDay(availableSlots);
    
    // Format for voice response
    const formattedAvailability = formatAvailabilityForVoice(groupedSlots);
    
    res.json({
      success: true,
      availability: formattedAvailability,
      rawSlots: groupedSlots
    });
  } catch (error) {
    console.error('Error getting calendar availability:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Schedule appointment endpoint
app.post('/api/calendar/schedule', async (req, res) => {
  try {
    console.log('Received request to schedule appointment', req.body);
    
    const { startTime, endTime, summary, description, attendees } = req.body;
    
    if (!startTime || !endTime) {
      return res.status(400).json({
        success: false,
        error: 'Start time and end time are required'
      });
    }
    
    // Create calendar event
    const event = await createCalendarEvent({
      startTime,
      endTime,
      summary: summary || 'Scheduled Meeting',
      description: description || '',
      attendees: attendees || []
    });
    
    res.json({
      success: true,
      event
    });
  } catch (error) {
    console.error('Error scheduling appointment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start server
const PORT = process.env.CALENDAR_PORT || 3001;
app.listen(PORT, () => {
  console.log(`Calendar API server running on port ${PORT}`);
  console.log(`Test with: curl http://localhost:${PORT}/api/calendar/availability`);
}); 