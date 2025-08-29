// Minimal ambient typings for 'newman' to support JS @ts-check via JSDoc imports
// This mirrors the common require('newman') usage pattern (export = newman)
declare module 'newman' {
  namespace newman {
    interface NewmanRunOptions {
      collection: any; // string path or PostmanCollection
      environment?: any; // string path or PostmanEnvironment
      reporters?: string[] | string;
      timeout?: number;
      delayRequest?: number;
      iterationCount?: number;
      bail?: boolean | { [key: string]: any };
      iterationData?: any; // string path or object
      reporter?: any; // reporter configuration bag (htmlextra/json/junit)
      // Allow unknown extra fields passed through options spreading
      [key: string]: any;
    }

    interface NewmanRunSummary {
      run: {
        stats: {
          requests: { total: number; failed: number; pending?: number };
          assertions: { total: number; failed: number; pending?: number };
          testScripts: { total: number; failed: number; pending?: number };
          prerequestScripts: { total: number; failed: number; pending?: number };
        };
        failures: Array<{
          error: { name: string; message: string; test?: string };
          source?: any;
        }>;
        executions: Array<{
          item: { name: string };
          request: { method: string; url: { toString(): string } };
          response?: { code: number; responseTime: number; responseSize: number };
          assertions?: Array<{
            assertion: string;
            skipped?: boolean;
            error?: { name: string; message: string };
          }>;
        }>;
        timings?: { started?: number; completed?: number };
      };
    }

    function run(
      options: NewmanRunOptions,
      callback: (err: any, summary: NewmanRunSummary) => void
    ): void;
  }

  export = newman;
}
