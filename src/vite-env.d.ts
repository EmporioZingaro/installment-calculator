/// <reference types="vite/client" />

// Allow importing .svg as URL strings
declare module '*.svg' {
  const src: string;
  export default src;
}
