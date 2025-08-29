// Augment 'newman' types to provide precise reporter option shapes for JS @ts-check consumers
// This refines the `reporter` bag on NewmanRunOptions without altering other upstream typings.
declare module 'newman' {
  namespace newman {
    interface HtmlextraReporterOptions {
      export?: string; // output HTML path
      template?: string; // template name/path (e.g., 'dashboard')
      logs?: boolean;
      browserTitle?: string;
      title?: string;
      displayProgressBar?: boolean;
      omitHeaders?: boolean;
      omitRequestBodies?: boolean;
      omitResponseBodies?: boolean;
      showOnlyFails?: boolean;
      [key: string]: any;
    }

    interface JsonReporterOptions {
      export?: string; // output JSON path
      [key: string]: any;
    }

    interface JUnitReporterOptions {
      export?: string; // output JUnit XML path
      [key: string]: any;
    }

    interface NewmanRunOptions {
      reporter?: {
        htmlextra?: HtmlextraReporterOptions;
        json?: JsonReporterOptions;
        junit?: JUnitReporterOptions;
        [name: string]: any;
      };
      // Keep permissive index signature for spread options used in JS runners
      [key: string]: any;
    }
  }
}
