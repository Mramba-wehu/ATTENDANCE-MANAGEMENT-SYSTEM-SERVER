import os from 'os'
import { execSync } from 'child_process'
import path from 'path'
import fs from 'fs'

export const intro = (port: number, mode: string = 'development'): string => {
  const isWindows = os.platform() === 'win32'
  execSync(isWindows ? 'cls' : 'clear', { stdio: 'inherit' })

  const pkgPath = path.resolve(__dirname, '../../package.json')
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))

  const version = pkg.version || 'unknown'
  const author = pkg.author || 'unknown'
  const license = pkg.license || 'UNLICENSED'

  const width = process.stdout.columns || 60
  const border = '─'.repeat(width)
  const center = (text: string) => {
    const pad = Math.max(0, Math.floor((width - text.length) / 2))
    return ' '.repeat(pad) + text
  }

  const lines = [
    border,
    center('🧠  AMS SERVER'),
    border,
    `📦  Version   : ${version}`,
    `👤  Author    : ${author}`,
    `📝  License   : ${license}`,
    `🔗  Status    : Connected to Store`,
    `🚀  Running at: http://localhost:${port}`,
    `🌐  Mode      : ${mode}`,
    border
  ]

  return lines.join('\n')
}