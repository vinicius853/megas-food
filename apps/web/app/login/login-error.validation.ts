import assert from 'node:assert/strict'

import { getLoginErrorMessage } from './login-error'

assert.equal(
  getLoginErrorMessage(
    new Error(
      JSON.stringify({
        message:
          'Sua conta está desativada. Entre em contato com o responsável pela loja ou com o suporte.',
      }),
    ),
  ),
  'Sua conta está desativada. Entre em contato com o responsável pela loja ou com o suporte.',
)

assert.equal(
  getLoginErrorMessage(
    new Error(
      JSON.stringify({
        message:
          'Esta loja está temporariamente desativada. Entre em contato com o suporte Megas Food.',
      }),
    ),
  ),
  'Esta loja está temporariamente desativada. Entre em contato com o suporte Megas Food.',
)

assert.equal(
  getLoginErrorMessage(new Error('Email ou senha inválidos.')),
  'Email ou senha inválidos.',
)
