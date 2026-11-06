// Static guest assets only: never credentials or the host message capability.
declare global {
  interface Window { __POPTART_HOST__?: {capability:string; parent:string; opaqueRelay:boolean}; __POPTART_GUEST__?: { audioHtml?: string; samples?: Record<string, string> } }
}
export {};
