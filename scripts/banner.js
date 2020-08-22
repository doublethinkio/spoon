const fs = require('fs')

const path = './dist/index.js'
const date = fs.readFileSync(path, 'utf-8')
const banner = '#!/usr/bin/env node'

fs.writeFileSync(path, banner + '\n' + date, 'utf-8')
