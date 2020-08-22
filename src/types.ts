/**
 * @see https://github.com/lukesampson/scoop/wiki/App-Manifests
 */
export interface AppManifestRequiredProperties {
  version: string
}
export interface AppManifestOptionalProperties {
  architecture: {
    '64bit': {
      bin: string | Array<string>
      checkver: string
      extract_dir: string
      url: string | Array<string>
      hash: string | Array<string>
      installer: {
        file: string
        script: string
        args: Array<string>
        keep: boolean
      }
      uninstaller: {
        file: string
        script: string
        args: Array<string>
        keep: boolean
      }
      pre_install: string
      post_install: string
      shortcuts: Array<Array<string>>
    }
    '32bit': {
      bin: string | Array<string>
      checkver: string
      extract_dir: string
      url: string | Array<string>
      hash: string | Array<string>
      installer: {
        file: string
        script: string
        args: Array<string>
        keep: boolean
      }
      uninstaller: {
        file: string
        script: string
        args: Array<string>
        keep: boolean
      }
      pre_install: string
      post_install: string
      shortcuts: Array<Array<string>>
    }
  }
  depends: Array<string>
  env_add_path: string
  env_set: string
  extract_dir: string
  extract_to: Array<string>
  innosetup: boolean
  installer: {
    file: string
    script: string
    args: Array<string>
    keep: boolean
  }
  uninstaller: {
    file: string
    script: string
    args: Array<string>
    keep: boolean
  }
  description: string
  homepage: string
  license: {
    identifier: string
    url: string
  }
  notes: string
  post_install: string
  pre_install: string
  psmodule: {
    name: string
  }
  url: string | Array<string>
  hash: string
  bin: string
  shortcuts: Array<Array<string>>
  suggest: Array<string>
  persist: string
  checkver: {
    url: string
    regex: string
  }
  autoupdate: {
    url: string
  }
}
export interface AppManifest
  extends AppManifestRequiredProperties,
    Partial<AppManifestOptionalProperties> {}
