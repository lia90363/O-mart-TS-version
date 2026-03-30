/// <reference types="vite/client" />

import 'pinia'

declare module 'pinia' {
  export interface DefineStoreOptionsBase<S, Store> {
    persist?: boolean | {
      paths?: string[];
    };
  }
}