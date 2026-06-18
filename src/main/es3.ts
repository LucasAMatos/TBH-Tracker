import crypto from 'node:crypto'

// Easy Save 3 (formato usado pelo TBH em SaveFile_Live.es3):
//   AES-128-CBC + PBKDF2-SHA1. O IV (16 bytes) fica no inicio do arquivo
//   e e usado tambem como salt do PBKDF2. Iteracoes = 100, key = 16 bytes.
const IV_SIZE = 16
const KEY_SIZE = 16 // AES-128
const PBKDF2_ITERATIONS = 100

export class Es3DecryptError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message)
    this.name = 'Es3DecryptError'
  }
}

/**
 * Descriptografa um buffer ES3 e retorna o JSON em texto (UTF-8).
 * Lanca Es3DecryptError se a chave estiver errada ou o arquivo for invalido.
 */
export function decryptES3(buffer: Buffer, password: string): string {
  if (buffer.length <= IV_SIZE) {
    throw new Es3DecryptError('Arquivo de save muito pequeno ou vazio.')
  }

  const iv = buffer.subarray(0, IV_SIZE)
  const cipherText = buffer.subarray(IV_SIZE)

  const key = crypto.pbkdf2Sync(
    Buffer.from(password, 'utf8'),
    iv, // o IV tambem e o salt no Easy Save 3
    PBKDF2_ITERATIONS,
    KEY_SIZE,
    'sha1'
  )

  try {
    const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv)
    decipher.setAutoPadding(true) // PKCS7
    const decrypted = Buffer.concat([decipher.update(cipherText), decipher.final()])
    return decrypted.toString('utf8')
  } catch (err) {
    // Padding invalido = chave quase sempre incorreta.
    throw new Es3DecryptError(
      'Falha ao descriptografar o save. A chave ES3 provavelmente esta incorreta.',
      err
    )
  }
}

/** Descriptografa e faz JSON.parse, com erro amigavel. */
export function decryptAndParseES3(buffer: Buffer, password: string): unknown {
  const text = decryptES3(buffer, password)
  try {
    return JSON.parse(text)
  } catch (err) {
    throw new Es3DecryptError(
      'Save descriptografado, mas o JSON e invalido (formato inesperado ou chave incorreta).',
      err
    )
  }
}
