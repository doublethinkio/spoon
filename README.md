A CLI program that proxys [scoop](https://github.com/lukesampson/scoop) Cli, which uses [gh-proxy](https://github.com/hunshcn/gh-proxy) to expedite downloading the Github Release file

## Install

```bash
yarn global add @doublethinkio/spoon
```

or

```bash
npm -g install @doublethinkio/spoon
```

## Usage

1. Set up your proxy server (You can skip this step but you will use the default Shared proxy server, It can be unstable.)
see: https://github.com/hunshcn/gh-proxy

2. Configure spoon to use The Proxy Server(If you skipped the first step, you can skip this one too)
```bash
spoon --url="Your own proxy server address"
```

3. Use Spoon to download the software
eg:
```bash
spoon install hyper
```
Spoon will only download the Github release as an agent.
The other source will not be called by the agent but via `scoop install` directly.
The command arguments passed to spoon will eventually be passed to Scoop, but no command other than the `install` command will make sense.
Therefore, with the exception of the install command, you might as well use scoop instead of spoon.





