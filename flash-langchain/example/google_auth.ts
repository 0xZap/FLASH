import { OAuth2Client } from 'google-auth-library';
import express from 'express';
import * as fs from 'fs';

const TOKEN_PATH = './.google-token.json';

export class GoogleAuth {
  private static oauth2Client: OAuth2Client;

  static init() {
    this.oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID, // Changed from GOOGLE_API_KEY
      process.env.GOOGLE_CLIENT_SECRET, // You'll need to add this to .env
      'http://localhost:8081/auth/google/callback'
    );

    return this.getAuthUrl();
  }

  static getAuthUrl() {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar', 'https://mail.google.com/']
    });
  }

  static async handleCallback(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);
    
    // Save tokens for future use
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
    return tokens;
  }

  static async getStoredTokens() {
    try {
      if (fs.existsSync(TOKEN_PATH)) {
        const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
        this.oauth2Client.setCredentials(tokens);
        return tokens;
      }
    } catch (error) {
      console.error('Error reading stored tokens:', error);
    }
    return null;
  }

  static getClient() {
    return this.oauth2Client;
  }
}

// Setup express server for OAuth callback
export function setupAuthServer() {
  const app = express();
  
  app.get('/auth/google/callback', async (req, res) => {
    const code = req.query.code as string;
    try {
      await GoogleAuth.handleCallback(code);
      res.send('Authentication successful! You can close this window.');
    } catch (error) {
      res.status(500).send('Authentication failed!');
    }
  });

  const server = app.listen(8081)
    .on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        console.log('Auth server already running on port 8081');
      } else {
        console.error('Auth server error:', error);
      }
    })
    .on('listening', () => {
      console.log('Auth server running on http://localhost:8081');
    });

  return server;
} 