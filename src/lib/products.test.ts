import { describe, it, expect } from "vitest";
import { PRODUCTS } from "./products";

describe("tarifs abonnement (nov. 2026)", () => {
  it("6 mois = 16,50 €", () => expect(PRODUCTS.abo6mois.price).toBe(16.5));
  it("1 an = 29,90 €", () => expect(PRODUCTS.abo1an.price).toBe(29.9));
  it("2 ans = 52 €", () => expect(PRODUCTS.abo2ans.price).toBe(52));
});
