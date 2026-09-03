import { createHmac, randomBytes } from 'node:crypto'

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export function createTotpSecret() {
  let bits = ''; for (const byte of randomBytes(20)) bits += byte.toString(2).padStart(8, '0')
  let output = ''; for (let i = 0; i < bits.length; i += 5) output += alphabet[parseInt(bits.slice(i, i + 5).padEnd(5, '0'), 2)]
  return output
}

function decode(input: string) {
  let bits = ''; for (const char of input.replace(/=+$/, '').toUpperCase()) bits += alphabet.indexOf(char).toString(2).padStart(5, '0')
  const bytes = []; for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2))
  return Buffer.from(bytes)
}

function codeAt(secret: string, offset: number) {
  const buffer = Buffer.alloc(8); buffer.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000) + offset))
  const digest = createHmac('sha1', decode(secret)).update(buffer).digest(); const index = digest[digest.length - 1] & 15
  return ((digest.readUInt32BE(index) & 0x7fffffff) % 1000000).toString().padStart(6, '0')
}

export function verifyTotpCode(secret: string, code: string) {
  const normalized = code.replace(/\s/g, '')
  return [-1, 0, 1].some((offset) => codeAt(secret, offset) === normalized)
}
