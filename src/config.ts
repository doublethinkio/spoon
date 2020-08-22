import Conf, { Schema } from 'conf'

export const defaultGhProxyUrl = 'https://gh.api.99988866.xyz/'

export interface ScoopPath {
  root: string
  apps: string
  buckets: string
  cache: string
  persist: string
  shims: string
}
function getScoopPath(root?: string): ScoopPath {
  return {
    root: root ?? '',
    apps: `${root}\\apps`,
    buckets: `${root}\\buckets`,
    cache: `${root}\\cache`,
    persist: `${root}\\persist`,
    shims: `${root}\\shims`,
  }
}

class Scoop {
  public path = {
    global: getScoopPath(process.env['SCOOP_GLOBAL']),
    local: getScoopPath(process.env['SCOOP']),
  }
}

export const scoop = new Scoop()

const schema: Schema<{
  url: string
}> = {
  url: {
    type: 'string',
    default: defaultGhProxyUrl,
  },
}

export const conf = new Conf({ schema })
