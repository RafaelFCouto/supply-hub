import { randomBytes, scryptSync } from 'node:crypto';

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hashedPassword = scryptSync(password, salt, 64).toString('hex');

  return `${salt}:${hashedPassword}`;
}
