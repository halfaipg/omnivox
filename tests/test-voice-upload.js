import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

// Get API key and URL from environment
const ULTRAVOX_API_KEY = process.env.ULTRAVOX_API_KEY;
const ULTRAVOX_API_URL = process.env.ULTRAVOX_API_URL;

// Path to the audio file
const audioFilePath = 'funny-cartoony-vocal-hillbilly-85022.mp3';

async function testVoiceUpload() {
  try {
    console.log('Starting voice upload test');
    console.log('API URL:', ULTRAVOX_API_URL);
    console.log('API Key (first 10 chars):', ULTRAVOX_API_KEY.substring(0, 10) + '...');
    console.log('File path:', audioFilePath);
    
    // Check if file exists
    if (!fs.existsSync(audioFilePath)) {
      console.error('Audio file not found:', audioFilePath);
      return;
    }
    
    const fileStats = fs.statSync(audioFilePath);
    console.log('File size:', fileStats.size, 'bytes');
    
    // Create FormData
    const formData = new FormData();
    formData.append('name', 'Test_Voice_Upload_123');
    formData.append('description', 'Test voice created via direct API');
    
    // Add file to FormData
    const fileStream = fs.createReadStream(audioFilePath);
    formData.append('file', fileStream, {
      filename: path.basename(audioFilePath),
      contentType: 'audio/mpeg'
    });
    
    console.log('FormData headers:', formData.getHeaders());
    
    // Set API URL for voice creation
    const apiUrl = `${ULTRAVOX_API_URL.replace('/calls', '')}/voices`;
    console.log('Full API URL:', apiUrl);
    
    // Make request to Ultravox API
    console.log('Sending request to Ultravox API...');
    const response = await axios.post(apiUrl, formData, {
      headers: {
        ...formData.getHeaders(),
        'X-API-Key': ULTRAVOX_API_KEY
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    
    console.log('API response status:', response.status);
    console.log('API response data:', response.data);
    console.log('Voice upload successful!');
    
  } catch (error) {
    console.error('Error uploading voice:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
    
    if (error.response?.headers) {
      console.error('Response headers:', error.response.headers);
    }
  }
}

// Run the test
testVoiceUpload(); 