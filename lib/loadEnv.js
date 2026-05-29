import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

/** Load variables from project root .env into process.env */
export function loadEnv() {
  const envPath = join(projectRoot, '.env')
  if (!existsSync(envPath)) return false

  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (key && process.env[key] === undefined) {
      process.env[key] = value
    }
  }
  return true
}

export function hasGeminiKey() {
  return Boolean(process.env.GEMINI_API_KEY?.trim())
}
