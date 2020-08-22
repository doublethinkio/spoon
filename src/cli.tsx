#!/usr/bin/env node
import React from 'react'
import { render } from 'ink'
import meow from 'meow'
import App from './ui'
import { defaultGhProxyUrl } from './config'
import PowerShell from './powershell'
import chalk from 'chalk'

const cli = meow(
  `
	Usages
	  $ spoon

	Options
    --url  Your own gh-proxy server url

	Examples
	  $ spoon --url='${defaultGhProxyUrl}'
    gh-proxy server address has been set to ${defaultGhProxyUrl} successfully!
`
)

const app = render(React.createElement(App, cli.flags))
app
  .waitUntilExit()
  .then(() => {
    // console.log(chalk.green('exited'))
  })
  .catch((error) => console.log(chalk.red(error.message)))
  .finally(() => {
    PowerShell.exit()
  })
