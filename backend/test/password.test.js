import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from '../src/security/password.js';

test('password hash verifies only the original secret', async () => {
  const hash = await hashPassword('una-contraseña-segura');

  assert.notEqual(hash, 'una-contraseña-segura');
  assert.equal(await verifyPassword('una-contraseña-segura', hash), true);
  assert.equal(await verifyPassword('otra-contraseña', hash), false);
});

test('invalid password encodings are rejected safely', async () => {
  assert.equal(await verifyPassword('cualquier-contraseña', undefined), false);
  assert.equal(await verifyPassword('cualquier-contraseña', 'formato-inválido'), false);
});
