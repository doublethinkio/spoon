declare module 'atomic-sleep' {
  function sleep(ms: number): Promise<void>
  export = sleep
}
