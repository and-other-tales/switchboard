import "server-only";
import twilio from "twilio";

// Create a function that returns the Twilio client
// This will be called at runtime, not build time
export function getTwilioClient() {
  const { TWILIO_ACCOUNT_SID: accountSid, TWILIO_AUTH_TOKEN: authToken } = process.env;
  
  if (!accountSid || !authToken) {
    console.warn("Twilio credentials not set. Twilio client will be disabled.");
    return null;
  }
  
  return twilio(accountSid, authToken);
}

// For backward compatibility
export default getTwilioClient;
