// Matchers del DOM (toBeInTheDocument, toHaveAttribute, ...) para Vitest.
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, vi } from "vitest";
import { instalarApiFalsa, reiniciarMundo } from "./testing/apiFalsa.js";

// Cada prueba parte con la API falsa recien sembrada, la copia de la interfaz cargada y el
// navegador limpio. Las que prueban el cliente HTTP reemplazan fetch por su propio mock.
beforeEach(() => {
	reiniciarMundo();
	instalarApiFalsa();
});

afterEach(() => {
	vi.unstubAllGlobals();
});
