import 'dotenv/config';
import { 
  getAvailableTimeSlots, 
  createCalendarEvent 
} from './utils/microsoft-calendar.js';

async function testMicrosoftCalendar() {
  try {
    console.log('Testing Microsoft Calendar integration...');
    
    // Test availability
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 7);
    
    console.log(`Checking availability from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    const availableSlots = await getAvailableTimeSlots(startDate, endDate);
    console.log(`Found ${availableSlots.length} available time slots`);
    
    if (availableSlots.length > 0) {
      console.log('First available slot:', availableSlots[0]);
    }
    
    // Test creating an event
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setMinutes(tomorrowEnd.getMinutes() + 30);
    
    console.log('Creating test event...');
    const event = await createCalendarEvent({
      startTime: tomorrow.toISOString(),
      endTime: tomorrowEnd.toISOString(),
      summary: 'Test Microsoft Calendar Integration',
      description: 'This is a test event created by the Microsoft Calendar integration test script.',
      attendees: [{ email: process.env.MS_USER_EMAIL }]
    });
    
    console.log('Event created successfully:', event);
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Error testing Microsoft Calendar integration:', error);
  }
}

testMicrosoftCalendar(); 