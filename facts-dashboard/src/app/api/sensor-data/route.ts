import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { SensorData } from '@/services/api';

// Store data in memory for the session
let sensorData: SensorData[] = [];

// Path for data storage - matching Flask server's data location
// First try to read from the Flask server's data directory, then fall back to local
const FLASK_DATA_DIR = path.join(process.cwd(), '..', 'data');
const LOCAL_DATA_DIR = path.join(process.cwd(), 'data');
const FLASK_SENSOR_FILE = path.join(FLASK_DATA_DIR, 'sensor_data.json');
const LOCAL_SENSOR_FILE = path.join(LOCAL_DATA_DIR, 'sensor_data.json');

// Ensure local data directory exists
try {
  if (!fs.existsSync(LOCAL_DATA_DIR)) {
    fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
  }
  
  // Try to load data from Flask server's directory first
  if (fs.existsSync(FLASK_SENSOR_FILE)) {
    const data = fs.readFileSync(FLASK_SENSOR_FILE, 'utf-8');
    sensorData = JSON.parse(data);
    console.log(`Loaded ${sensorData.length} sensor records from Flask server's data directory`);
  } 
  // If Flask data not available, try local data
  else if (fs.existsSync(LOCAL_SENSOR_FILE)) {
    const data = fs.readFileSync(LOCAL_SENSOR_FILE, 'utf-8');
    sensorData = JSON.parse(data);
    console.log(`Loaded ${sensorData.length} sensor records from local data directory`);
  } else {
    // Create empty local file if neither exists
    fs.writeFileSync(LOCAL_SENSOR_FILE, JSON.stringify([]));
    console.log('Created empty sensor data file');
  }
} catch (error) {
  console.error('Error initializing sensor data storage:', error);
}

// GET handler for sensor data
export async function GET() {
  // Refresh data from file on each request to get latest updates from Flask server
  try {
    if (fs.existsSync(FLASK_SENSOR_FILE)) {
      const data = fs.readFileSync(FLASK_SENSOR_FILE, 'utf-8');
      sensorData = JSON.parse(data);
    } else if (fs.existsSync(LOCAL_SENSOR_FILE)) {
      const data = fs.readFileSync(LOCAL_SENSOR_FILE, 'utf-8');
      sensorData = JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading sensor data file:', error);
  }
  
  return NextResponse.json(sensorData);
}

// POST handler for sensor data
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate data
    if (!data || typeof data !== 'object') {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }
    
    // Add timestamp if not present
    if (!data.timestamp) {
      data.timestamp = new Date().toISOString();
    }
    
    // Add to memory
    sensorData.push(data);
    
    // Keep only the latest 100 entries
    if (sensorData.length > 100) {
      sensorData = sensorData.slice(-100);
    }
    
    // Save to local file
    try {
      fs.writeFileSync(LOCAL_SENSOR_FILE, JSON.stringify(sensorData, null, 2));
    } catch (error) {
      console.error('Error saving data to file:', error);
    }
    
    return NextResponse.json({ 
      status: 'sensor data saved',
      json_saved: true,
      mongo_saved: false
    });
  } catch (error) {
    console.error('Error processing sensor data:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
