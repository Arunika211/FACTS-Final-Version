import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { CVActivity } from '@/services/api';

// Store data in memory for the session
let cvData: CVActivity[] = [];

// Path for data storage - matching Flask server's data location
// First try to read from the Flask server's data directory, then fall back to local
const FLASK_DATA_DIR = path.join(process.cwd(), '..', 'data');
const LOCAL_DATA_DIR = path.join(process.cwd(), 'data');
const FLASK_CV_FILE = path.join(FLASK_DATA_DIR, 'cv_activity.json');
const LOCAL_CV_FILE = path.join(LOCAL_DATA_DIR, 'cv_activity.json');

// Ensure local data directory exists
try {
  if (!fs.existsSync(LOCAL_DATA_DIR)) {
    fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
  }
  
  // Try to load data from Flask server's directory first
  if (fs.existsSync(FLASK_CV_FILE)) {
    const data = fs.readFileSync(FLASK_CV_FILE, 'utf-8');
    cvData = JSON.parse(data);
    console.log(`Loaded ${cvData.length} CV activity records from Flask server's data directory`);
  } 
  // If Flask data not available, try local data
  else if (fs.existsSync(LOCAL_CV_FILE)) {
    const data = fs.readFileSync(LOCAL_CV_FILE, 'utf-8');
    cvData = JSON.parse(data);
    console.log(`Loaded ${cvData.length} CV activity records from local data directory`);
  } else {
    // Create empty local file if neither exists
    fs.writeFileSync(LOCAL_CV_FILE, JSON.stringify([]));
    console.log('Created empty CV activity file');
  }
} catch (error) {
  console.error('Error initializing CV data storage:', error);
}

// GET handler for CV activity data
export async function GET() {
  // Refresh data from file on each request to get latest updates from Flask server
  try {
    if (fs.existsSync(FLASK_CV_FILE)) {
      const data = fs.readFileSync(FLASK_CV_FILE, 'utf-8');
      cvData = JSON.parse(data);
    } else if (fs.existsSync(LOCAL_CV_FILE)) {
      const data = fs.readFileSync(LOCAL_CV_FILE, 'utf-8');
      cvData = JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading CV activity file:', error);
  }
  
  return NextResponse.json(cvData);
}

// POST handler for CV activity data
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
    cvData.push(data);
    
    // Keep only the latest 100 entries
    if (cvData.length > 100) {
      cvData = cvData.slice(-100);
    }
    
    // Save to local file
    try {
      fs.writeFileSync(LOCAL_CV_FILE, JSON.stringify(cvData, null, 2));
    } catch (error) {
      console.error('Error saving CV data to file:', error);
    }
    
    return NextResponse.json({ 
      status: 'cv activity saved',
      json_saved: true,
      mongo_saved: false
    });
  } catch (error) {
    console.error('Error processing CV activity data:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
