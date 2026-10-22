import { randomBytes, scrypt as scryptCallback, scryptSync, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;
const dummySalt = Buffer.from('c2lwZWMtYXV0aC1kdW1teQ', 'base64url');
const dummyHash = scryptSync('invalid-password', dummySalt, KEY_LENGTH);

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const derivedKey = await scrypt(password, salt, KEY_LENGTH);
  return `scrypt$${salt.toString('base64url')}$${derivedKey.toString('base64url')}`;
}

export async function verifyPassword(password, encodedHash) {
  const [, saltValue, hashValue, extra] = (encodedHash ?? '').split('$');
  const validEncoding = !extra && saltValue && hashValue;
  const salt = validEncoding ? Buffer.from(saltValue, 'base64url') : dummySalt;
  const expected = validEncoding ? Buffer.from(hashValue, 'base64url') : dummyHash;
  const actual = await scrypt(password, salt, KEY_LENGTH);
  const matches = actual.length === expected.length && timingSafeEqual(actual, expected);
  return Boolean(validEncoding && matches);
}
