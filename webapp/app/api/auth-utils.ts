'use server';

import { OAuth2Client } from 'google-auth-library';

const oauth2Client = new OAuth2Client();

export const verifyIamToken = async (token: string, audience: string | undefined): Promise<boolean> => {
  try {
    await oauth2Client.verifyIdToken({
      idToken: token,
      audience: audience
    });
    return true;
  } catch (error) {
    console.error("IAM token verification failed:", error);
    return false;
  }
};