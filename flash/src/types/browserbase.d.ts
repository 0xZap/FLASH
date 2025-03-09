declare module '@browserbasehq/sdk' {
  export class Browserbase {
    constructor(options: { apiKey: string });
    
    connect(sessionId: string): Promise<any>;
    
    sessions: {
      create(options: { projectId: string; name?: string }): Promise<{ 
        id: string;
        connectUrl: string;
      }>;
    };
  }
}

declare module '@browserbasehq/stagehand' {
  import { Page } from 'puppeteer-core';
  
  export class Stagehand {
    constructor(options: {
      env: "BROWSERBASE";
      apiKey: string;
      projectId: string;
      modelName: string;
      modelClientOptions: {
        apiKey: string;
      };
    });
    
    init(): Promise<void>;
    close(): Promise<void>;
    
    page: {
      goto(url: string): Promise<void>;
      observe(instruction: string): Promise<string[]>;
      act(action: string): Promise<void>;
      extract(options: {
        instruction: string;
        schema: any;
      }): Promise<any>;
      url(): string;
      title(): Promise<string>;
    };
  }
} 