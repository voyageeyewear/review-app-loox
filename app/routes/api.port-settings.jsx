import { json } from "@remix-run/node";
import fs from 'fs';
import path from 'path';

const PORT_SETTINGS_FILE = path.join(process.cwd(), 'port-settings.json');

export const loader = async ({ request }) => {
  try {
    if (fs.existsSync(PORT_SETTINGS_FILE)) {
      const data = JSON.parse(fs.readFileSync(PORT_SETTINGS_FILE, 'utf8'));
      return json({
        success: true,
        port: data.port || 61406,
        updatedAt: data.updatedAt
      });
    }
  } catch (error) {
    console.error('Error reading port settings:', error);
  }
  
  // Default fallback
  return json({
    success: true,
    port: 61406,
    updatedAt: new Date().toISOString()
  });
}; 