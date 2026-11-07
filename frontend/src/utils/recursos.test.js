import { esExterna, recurso } from "./recursos.js";

describe("esExterna", () => {
	it.each(["https://ejemplo.cl/a.webp", "http://ejemplo.cl", "//cdn.ejemplo.cl/a.webp", "#ancla", "mailto:a@b.cl"])(
		"«%s» es externa",
		(ruta) => expect(esExterna(ruta)).toBe(true),
	);

	it.each(["resources/img/cpu.svg", "/resources/img/cpu.svg", "img/a.webp"])("«%s» es una ruta del sitio", (ruta) =>
		expect(esExterna(ruta)).toBe(false),
	);
});

describe("recurso", () => {
	it("una ruta relativa a public/ se resuelve desde la base del sitio", () => {
		expect(recurso("resources/img/cpu.svg")).toBe(`${import.meta.env.BASE_URL}resources/img/cpu.svg`);
	});

	it("una URL completa se deja como esta", () => {
		expect(recurso("https://ejemplo.cl/video.mp4")).toBe("https://ejemplo.cl/video.mp4");
	});

	it("una ruta absoluta se deja como esta", () => {
		expect(recurso("/resources/img/cpu.svg")).toBe("/resources/img/cpu.svg");
	});

	it("una ruta vacia o ausente no da recurso", () => {
		expect(recurso("")).toBe("");
		expect(recurso(undefined)).toBe("");
	});
});
