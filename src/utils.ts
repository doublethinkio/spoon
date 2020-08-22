import { arch } from 'os'
import PowerShell from './powershell'
import { scoop } from './config'
import fs from 'fs-extra'
import walk from 'walk'
import path from 'path'
import { any } from 'bluebird'
import download from 'download'
import { AppManifest } from 'types'
import { GotStream, Progress } from 'got'

export function purifyArgv(): string[] {
  let result = process.argv
  const urlIndex = process.argv.indexOf('--url')
  const urlIndex2 = process.argv.findIndex((it) => it.includes('--url='))

  if (urlIndex !== -1) {
    result = result.slice(0, urlIndex).concat(result.slice(urlIndex + 2))
  } else if (urlIndex2 !== -1) {
    result = result.slice(0, urlIndex2).concat(result.slice(urlIndex2 + 1))
  }

  return result.slice(2)
}

export async function hasScoop(): Promise<boolean> {
  const powershell = PowerShell.getSingleton()

  if (!scoop.path.local.root) return false

  const result = await powershell.write(`scoop which scoop`)

  return (
    result.trim() === `${scoop.path.local.apps}\\scoop\\current\\bin\\scoop.ps1`
  )
}

/**
 * @see https://github.com/lukesampson/scoop/issues/3842#issuecomment-582422420
 * @example
 * name: googlechrome version: '84.0.4147.125'
 * url: 'https://dl.google.com/release2/chrome/KbuaLVzIJBeQ9qQfr-NEhA_84.0.4147.125/84.0.4147.125_chrome_installer.exe#/dl.7z'
 * <NameOfManifest>#<version>#<url>
 * googlechrome#84.0.4147.105#https_dl.google.com_release2_chrome_BaBRExYjv6yO9XgQ19F1fQ_84.0.4147.105_84.0.4147.105_chrome_installer.exe_dl.7z
 *
 */
export async function getAppCacheFileName(
  app: string,
  version: string,
  url: string
): Promise<string> {
  const format = (url: string) =>
    url.replace(/(http|https):\/\//, '$1_').replace(/\//g, '_')

  return `${app}#${version}#${format(url)}`
}

export async function getBuckets(): Promise<Array<string>> {
  return fs.readdir(scoop.path.local.buckets)
}

export async function getAppManifest(app: string): Promise<AppManifest> {
  const fileName = `${app}.json`
  const walkers = (await getBuckets())
    .map(
      (it) =>
        `${scoop.path.local.buckets.split(path.sep).join('/')}/${it}/bucket/`
    )
    .map<Promise<string>>(async (it) => {
      const walker = walk.walk(it)

      return await new Promise((resolve, reject) => {
        walker.on('file', (root, fileStats, next) => {
          if (fileStats.name === fileName) {
            resolve(`${root}${fileName}`)
          } else {
            next()
          }
        })

        walker.on('errors', (_root, _nodeStatsArray, next) => {
          next()
        })

        walker.on('end', () => {
          reject()
        })
      })
    })

  try {
    return fs.readJSON(await any(walkers)) as Promise<AppManifest>
  } catch (error) {
    throw new Error(`Could not find manifest for ${app}.`)
  }
}

export async function installApp(
  app: string,
  version: string,
  urls: Array<string>
): Promise<ReturnType<GotStream>> {
  const cacheDir = scoop.path.local.cache!
  const filename = await getAppCacheFileName(app, version, urls[0])
  const stream = (download(urls[0], cacheDir, {
    filename,
  }) as unknown) as ReturnType<GotStream>

  stream.on('downloadProgress', (progress: Progress) => {
    console.log(progress.percent)
  })

  return stream
}

export const getArch = () => (arch() === 'x32' ? '32bit' : '64bit')

export const toArray = <T>(value: T | T[]) =>
  Array.isArray(value) ? value : [value]

export const getAppDownloadUrl = (manifest: AppManifest) => {
  if (manifest.url) {
    return manifest.url
  } else {
    return manifest.architecture?.[getArch()].url!
  }
}

export const getPercentage = (percent: number): string =>
  `${Math.floor(percent * 100)}%`
