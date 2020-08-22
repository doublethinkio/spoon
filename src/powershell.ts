import { spawn, ChildProcessWithoutNullStreams } from 'child_process'
import { EventEmitter } from 'events'
import { EOL } from 'os'

export interface Options {
  cleanOutPut: boolean
  encoding: BufferEncoding
  noExit: boolean
  noProfile: boolean
}
class PowerShell extends EventEmitter {
  public process: ChildProcessWithoutNullStreams
  public chunks: string[] = []
  public options: Options = {
    cleanOutPut: true,
    encoding: 'utf-8',
    noProfile: true,
    noExit: true,
  }

  private promptLineCount = 0
  private writeCount = 0

  private fragments: string = ''

  private static singleton: PowerShell | null = null
  public static getSingleton(options?: Partial<Options>): PowerShell {
    if (!PowerShell.singleton) PowerShell.singleton = new PowerShell(options)
    return PowerShell.singleton
  }
  public static exit(): void {
    if (PowerShell.singleton) {
      PowerShell.singleton.exit()
    }
  }

  public static async execute(
    command: string
  ): Promise<number | NodeJS.Signals> {
    return await new Promise((resolve, reject) => {
      const powershell = spawn(
        'powershell.exe',
        [
          '-NoLogo',
          '-ExecutionPolicy',
          'ByPass',
          '-Command',
          `& { ${command} }`,
        ],
        {
          stdio: ['ignore', 'inherit', 'inherit'],
        }
      )

      powershell.on('exit', (code, signal) => {
        resolve(code ?? signal!)
      })

      powershell.on('error', (error) => {
        reject(error)
      })
    })
  }

  constructor(options?: Partial<Options>) {
    super()

    this.options = { ...this.options, ...options }

    const powershellOptions = [
      '-NoLogo',
      '-NoExit',
      ...(this.options.noProfile ? ['-NoProfile'] : []),
      '-ExecutionPolicy',
      'ByPass',
    ]

    this.process = spawn('powershell.exe', powershellOptions, {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: false,
    })

    this.process.stdin.setDefaultEncoding(this.options.encoding)
    this.process.stdout.setEncoding(this.options.encoding)
    this.process.stderr.setEncoding(this.options.encoding)
  }

  public async write(command: string): Promise<string> {
    return await new Promise((resolve, reject) => {
      this.writeCount++

      const onStderrData = (err: any): void => void reject(err)
      const onProcessClose = (code: number): void => void reject(code)
      const onStdoutData = (chunk: Buffer): void => {
        const chunk_ = chunk.toString()
        const isPromptLine = this.isPromptLine(chunk_)
        const isCommandSelf = this.isCommandSelf(chunk_, command)
        const shouldClear = isPromptLine || isCommandSelf

        if (isPromptLine) this.promptLineCount++

        if (!this.options.cleanOutPut || !shouldClear) {
          this.fragments += chunk_
          if (this.fragments.indexOf(EOL) !== -1) {
            this.fragments
              .split(EOL)
              .filter((it) => {
                if (it === '') return false
                const isPromptLine = this.isPromptLine(it)
                const isCommandSelf = this.isCommandSelf(it, command)
                const shouldClear = isPromptLine || isCommandSelf
                if (shouldClear) return false
                return true
              })
              .map((it) => `${it}${EOL}`)
              // eslint-disable-next-line array-callback-return
              .map((it) => {
                this.chunks.push(it)
                this.emit('output', it)
              })
            this.fragments = ''
          }
        }

        if (
          this.promptLineCount > 1 &&
          this.promptLineCount - this.writeCount === 1
        ) {
          resolve(this.chunks.join(''))
          this.chunks = []
          this.process.stdout.off('data', onStdoutData)
          this.process.stderr.off('data', onStderrData)
          this.process.off('close', onProcessClose)
        }
      }

      this.process.stdout.on('data', onStdoutData)
      this.process.stderr.on('data', onStderrData)
      this.process.on('close', onProcessClose)

      this.process.stdin.write(`${command}${EOL}`)
    })
  }

  private isPromptLine(str: string): boolean {
    return /^PS .*>$/.test(str.trim())
  }

  private isCommandSelf(str: string, command: string): boolean {
    return str.trim() === command.trim()
  }

  public exit(): void {
    this.process.kill()
  }
}

export default PowerShell
