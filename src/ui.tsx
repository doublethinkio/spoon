import React, { useEffect, useMemo, useState } from 'react'
import { Text, Box, useApp } from 'ink'
import { conf, scoop, defaultGhProxyUrl } from './config'
import {
  purifyArgv,
  hasScoop,
  getAppManifest,
  toArray,
  getAppDownloadUrl,
  getAppCacheFileName,
  getPercentage,
} from './utils'
import { useAsync } from './hooks'
import { Progress, GotStream } from 'got'
import { useImmer } from 'use-immer'
import download from 'download'
import isUrl from 'is-url'
import PowerShell from './powershell'
import fs from 'fs-extra'
import path from 'path'
import urlJoin from 'url-join'
import { ProgressBar } from './component'
import Link from 'ink-link'
import prettyBytes from 'pretty-bytes'
import chalk from 'chalk'

export interface Props {
  url?: string
}
const App: React.FC<Props> = ({ url }): React.ReactElement => {
  const url_ = url === 'default' ? defaultGhProxyUrl : url ?? conf.get('url')
  const { status, value: hasScoop_, error } = useAsync(hasScoop)
  const { exit } = useApp()
  const [progress, setProgress] = useImmer<
    Array<
      Progress & {
        fileName: string
      }
    >
  >([])
  const isCompleted =
    progress.length > 0 && progress.every((it) => it.percent === 1)
  const [isFirst, toggleIsFirst] = useState(true)
  const [info, setInfo] = useState<JSX.Element | null>(null)

  useEffect(() => {
    if (url === 'default') {
      conf.set('url', defaultGhProxyUrl)
      setInfo(
        <Text>
          gh-proxy server address has been set to
          <Link url={defaultGhProxyUrl}>
            <Text color="cyan">{defaultGhProxyUrl}</Text>
          </Link>
          successfully!
        </Text>
      )
    } else if (url && isUrl(url)) {
      conf.set('url', url)
      setInfo(
        <Text>
          gh-proxy server address has been set to
          <Link url={url}>
            <Text color="cyan">{url}</Text>
          </Link>
          successfully!
        </Text>
      )
    } else if (url === void 0) {
      setInfo(
        <Text>
          The proxy address currently in use is:{' '}
          <Link url={url_}>
            <Text color="cyan">{url_}</Text>
          </Link>
        </Text>
      )
    } else {
      return exit(new Error('You typed in the wrong URL'))
    }
  }, [exit, url, url_])

  useEffect(() => {
    if (status === 'error' || hasScoop_ === false) {
      return exit(new Error(error ?? `You haven't installed Scoop yet`))
    }
  }, [status, hasScoop_, exit, error])

  useEffect(() => {
    if (!hasScoop_) return void 0
    if (!isFirst) return void 0

    toggleIsFirst(false)

    async function main() {
      const argv = purifyArgv()
      const isInstallAction = /^install/i.test(argv[0].trim())
      const app = argv[1]
      const command = `scoop ${argv.join(' ')}`
      console.log(chalk.blue(command))

      try {
        if (isInstallAction) {
          const manifest = await getAppManifest(app)
          const urls = toArray(getAppDownloadUrl(manifest))
          const regex = /^(?:https?:\/\/)?github\.com\/.+?\/.+?\/(?:releases|archive)\/.*$/i
          const isGithubReleasesUrl = urls.every((it) => regex.test(it))
          if (isGithubReleasesUrl) {
            await PowerShell.execute('scoop update scoop')

            const cacheDir = scoop.path.local.cache!

            const installApp = async (
              url: string,
              index: number,
              urls: Array<string>
            ) => {
              const isLast = url === urls[urls.length - 1]
              const baseFileName = path.basename(new URL(url).pathname)
              const cacheFileName = await getAppCacheFileName(
                app,
                manifest.version,
                url
              )

              if (!fs.pathExistsSync(path.join(cacheDir, cacheFileName))) {
                const stream = (download(urlJoin(url_, url), cacheDir, {
                  filename: cacheFileName,
                }) as unknown) as ReturnType<GotStream>

                stream.on('downloadProgress', (progress: Progress) => {
                  setProgress((progress_) => {
                    progress_[index] = { ...progress, fileName: baseFileName }
                  })
                })

                return () => {
                  stream.removeAllListeners('downloadProgress')
                  stream.removeAllListeners('end')
                }
              } else {
                if (isLast) {
                  await PowerShell.execute(command)
                  return exit()
                }
              }
            }

            urls.map(installApp)
          } else {
            await PowerShell.execute(command)
            return exit()
          }
        } else {
          await PowerShell.execute(command)
          return exit()
        }
      } catch (error) {
        return exit(error)
      }
    }

    main()

    return void 0
  }, [exit, hasScoop_, setProgress, url, isFirst, url_])

  useEffect(() => {
    if (!isCompleted) return void 0

    async function execute() {
      const argv = purifyArgv()
      const command = `scoop ${argv.join(' ')}`

      await PowerShell.execute(command)

      return exit()
    }

    try {
      execute()
    } catch (error) {
      return exit(error)
    }

    return void 0
  }, [exit, isCompleted])

  return useMemo(
    () => (
      <Box flexDirection="column">
        <Box>
          <Text color="blue">{info}</Text>
        </Box>
        {progress.length > 0 &&
          progress.map((it, index) => (
            <Box key={index}>
              <Box width="100%">
                <Box>
                  <Text color="blue">Downloading {it.fileName}: </Text>
                </Box>
                <Box flexBasis="30%" marginLeft={2}>
                  <ProgressBar percent={it.percent} />
                </Box>
                <Box justifyContent="space-between">
                  <Box marginLeft={2}>
                    <Text color="green">
                      percent: {getPercentage(it.percent)}
                    </Text>
                  </Box>
                  <Box marginLeft={2}>
                    <Text color="blue">total: {prettyBytes(it.total!)}</Text>
                  </Box>
                  <Box marginLeft={2}>
                    <Text color="blue">
                      completed: {prettyBytes(it.transferred!)}
                    </Text>
                  </Box>
                </Box>
              </Box>
            </Box>
          ))}
      </Box>
    ),
    [info, progress]
  )
}

export default App
