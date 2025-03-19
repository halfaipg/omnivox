import { getAvailableTimeSlots, groupAvailableSlotsByDay, formatAvailabilityForVoice } from './utils/google-calendar.js';

// Test calendar availability for the next 7 days
async function testCalendarAvailability() {
  try {
    console.log('Testing Google Calendar integration...');
    
    // Get current date and date 7 days from now
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 7);
    
    console.log(`Checking availability from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`);
    
    // Get available time slots
    console.log('Fetching available time slots...');
    const availableSlots = await getAvailableTimeSlots(startDate, endDate, 30);
    console.log(`Found ${availableSlots.length} available time slots`);
    
    // Group slots by day and time of day
    console.log('Grouping slots by day...');
    const groupedSlots = groupAvailableSlotsByDay(availableSlots);
    
    // Format for voice response
    console.log('Formatting for voice response...');
    const formattedAvailability = formatAvailabilityForVoice(groupedSlots);
    
    // Display results
    console.log('\nAvailability Text:');
    console.log(formattedAvailability.availabilityText);
    
    console.log('\nAvailable Days:');
    formattedAvailability.availableDays.forEach(day => {
      console.log(`- ${day.formattedDate}: ${day.timeOfDayAvailable.join(', ')}`);
    });
    
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Error testing calendar availability:', error);
  }
}

// Run the test
testCalendarAvailability(); 