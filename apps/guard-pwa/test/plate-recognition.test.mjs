import assert from 'node:assert/strict';
import { test } from 'node:test';
import { extractPlateCandidate } from '../src/lib/plate-recognition.mjs';

test('extrae una sugerencia alfanumérica y conserva separadores de placa', () => {
  assert.equal(extractPlateCandidate('PLACA: ABC-1234\nCOLOR: AZUL'), 'ABC-1234');
  assert.equal(extractPlateCandidate('QAA1001'), 'QAA-1001');
  assert.equal(extractPlateCandidate('ABC 1234'), 'ABC-1234');
  assert.equal(extractPlateCandidate('Gobierno de Puebla TRT-827-A Transporte privado'), 'TRT-827-A');
  assert.equal(extractPlateCandidate('Gobierno de Puebla TRT 827 A Transporte privado'), 'TRT-827-A');
  assert.equal(extractPlateCandidate('TRT827A'), 'TRT-827-A');
});

test('no propone texto sin patrón mínimo alfanumérico de placa', () => {
  assert.equal(extractPlateCandidate('VEHICULO SIN PLACAS'), null);
  assert.equal(extractPlateCandidate('2026'), null);
  assert.equal(extractPlateCandidate(''), null);
});