import assert from "node:assert/strict";
import test from "node:test";
import { categoryLabels, photoErrorMessage, unconfirmedSave } from "../src/dev/adminCopy.js";
import { portfolioTypes } from "../src/pages/Category/portfolioData.js";

test("uses Portuguese display labels for every existing category slug", () => {
  assert.deepEqual(Object.keys(categoryLabels), portfolioTypes);
  assert.equal(categoryLabels["events-bts"], "Bastidores");
});

test("localizes known photo validation errors without displaying arbitrary responses", () => {
  assert.match(photoErrorMessage({ status: 400, message: "Photo title must have at most 160 characters." }), /até 160 caracteres/);
  assert.match(photoErrorMessage({ status: 413 }), /limite de tamanho/);
  assert.match(photoErrorMessage({ status: 415 }), /JPEG, PNG ou WebP/);
  assert.equal(photoErrorMessage({ status: 400, message: "Unexpected internal server message." }), "Confira os campos e tente novamente.");
});

test("preserves a reconciliation reference while localizing provider and persistence failures", () => {
  const reference = "12345678-0000-0000-0000-123456789abc";
  const message = "Give the workspace operator this reference before retrying: " + reference;
  assert.equal(photoErrorMessage({ status: 502, message }),
    `Não foi possível confirmar o envio da imagem. Informe a referência ${reference} ao suporte antes de tentar novamente.`);
  assert.match(photoErrorMessage({ status: 503, message }), /gravação no banco de dados/);
  assert.equal(photoErrorMessage({ status: 502, message: "Unknown provider error." }), unconfirmedSave);
});
