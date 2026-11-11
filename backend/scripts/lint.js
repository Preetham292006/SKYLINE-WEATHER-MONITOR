const { execFileSync } = require('node:child_process')
const { readdirSync } = require('node:fs')
const { join } = require('node:path')

function javascriptFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return entry.name === 'node_modules' ? [] : javascriptFiles(path)
    return entry.isFile() && path.endsWith('.js') ? [path] : []
  })
}

const files = javascriptFiles(__dirname + '\\..')
for (const file of files) execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' })
console.log(`Backend syntax check passed (${files.length} files).`)
