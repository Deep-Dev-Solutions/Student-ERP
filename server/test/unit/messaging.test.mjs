// Unit tests for the ported business rules in src/domain/messaging.ts (compare to
// client/src/lib/messaging.ts: smsSegments, messageCost).
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { smsSegments, messageCost, SMS_RATE, WHATSAPP_RATE } = require("../../dist/domain/messaging.js");

describe("smsSegments", () => {
  test("empty text takes no segments", () => assert.equal(smsSegments(""), 0));
  test("plain text up to 160 characters is one segment", () => assert.equal(smsSegments("a".repeat(160)), 1));
  test("plain text over 160 characters splits into 153-character segments", () => assert.equal(smsSegments("a".repeat(161)), Math.ceil(161 / 153)));
  test("unicode text (e.g. Urdu) takes shorter segments", () => {
    const text = "ا".repeat(71);
    assert.equal(smsSegments(text), Math.ceil(71 / 67));
    assert.equal(smsSegments("ا".repeat(70)), 1);
  });
});

describe("messageCost", () => {
  test("WhatsApp is a flat rate regardless of length", () => {
    assert.equal(messageCost("whatsapp", "short"), WHATSAPP_RATE);
    assert.equal(messageCost("whatsapp", "a".repeat(500)), WHATSAPP_RATE);
  });
  test("SMS costs the rate per segment", () => {
    assert.equal(messageCost("sms", "a".repeat(160)), 1 * SMS_RATE);
    assert.equal(messageCost("sms", "a".repeat(161)), Math.ceil(161 / 153) * SMS_RATE);
  });
});
