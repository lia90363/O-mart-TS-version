/// <reference types="vite/client" />

import 'pinia'

declare module 'pinia' {
  export interface DefineStoreOptionsBase<S, Store> {
    persist?: boolean | object; // 讓 Pinia 認識 persist
  }
}