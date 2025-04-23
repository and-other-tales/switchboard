import "server-only";
import twilio from "twilio";

const { TWILIO_ACCOUNT_SID: accountSid, TWILIO_AUTH_TOKEN: authToken } =
  process.env;

export const twilioClient =
  accountSid && authToken ? twilio(accountSid, authToken) : null;
export default twilioClient;
