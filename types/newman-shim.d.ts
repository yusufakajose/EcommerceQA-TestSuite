// Ensure TypeScript can resolve 'newman' types from JS with @ts-check
// Re-export the DefinitelyTyped definitions under the module name used at runtime.
declare module 'newman' {
  export * from '@types/newman';
}
