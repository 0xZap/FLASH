import * as fs from 'fs';
import { GoogleConfig } from 'zap_tools_core';
import { GoogleAuth, setupAuthServer } from './google_auth';
import { Server } from 'http';

interface GoogleToken {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

async function setGoogleToken(): Promise<void> {
  try {
    // Try to get stored tokens first
    const storedTokens = await GoogleAuth.getStoredTokens();
    
    if (storedTokens) {
      // Set the environment variable
      process.env.GOOGLE_TOKEN = storedTokens.access_token;
      
      // Initialize GoogleConfig with the token
    //   GoogleConfig.resetInstance();
    //   GoogleConfig.getInstance({
    //     token: storedTokens.access_token
    //   });

      console.log('Successfully set GOOGLE_TOKEN environment variable from stored tokens');
      return;
    }

    // If no stored tokens, start authentication flow
    console.log('No stored tokens found. Starting authentication flow...');
    
    let server: Server | null = null;
    try {
      // Setup Google Auth
      server = setupAuthServer();
    
      // Check for stored tokens
      const storedTokens = await GoogleAuth.getStoredTokens();
    
      if (!storedTokens) {
        // If no stored tokens, start OAuth flow
        const authUrl = GoogleAuth.init();
        console.log('Please visit this URL to authorize the application:', authUrl);
        console.log('Waiting for authentication...');
        
        // Wait for authentication to complete
        await new Promise(resolve => {
          const checkToken = setInterval(async () => {
            const tokens = await GoogleAuth.getStoredTokens();
            if (tokens) {
              clearInterval(checkToken);
              // Set the environment variable
              process.env.GOOGLE_TOKEN = tokens.access_token;
              // Close the auth server after successful authentication
              if (server) {
                server.close();
              }
              resolve(tokens);
            }
          }, 1000);
        });
      } else {
        // If we have stored tokens, we can close the auth server immediately
        if (server) {
          server.close();
        }
      }

      if (!storedTokens?.access_token) {
        throw new Error("Google API token not found");
      }

      console.log('Successfully authenticated and set GOOGLE_TOKEN environment variable');
    } finally {
      // Clean up server
      if (server) {
        server.close();
      }
    }
  } catch (error) {
    console.error('Error setting Google token:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

if (require.main === module) {
  setGoogleToken();
}

export { setGoogleToken }; 