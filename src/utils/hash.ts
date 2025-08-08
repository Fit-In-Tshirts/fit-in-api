import bcrypt from 'bcrypt'

const SALT_ROUNDS = 10

export async function hashPassword(plainPassword: string): Promise<string> {
  const hashedPassword = await bcrypt.hash(plainPassword, SALT_ROUNDS)
  return hashedPassword
}

export async function comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword)
}