import { getAppManifest } from '../src/utils'

test('Should find the googlechrome manifest file', async () => {
  const manifest = await getAppManifest('googlechrome')

  expect(manifest.homepage).toBe('https://www.google.com/chrome/')
})

test('The error should be thrown when the manifest file is not found', async () => {
  const app = 'An app that can not exist'
  try {
    await getAppManifest(app)
  } catch (error) {
    expect(error.message).toBe(`Could not find manifest for ${app}.`)
  }
})
