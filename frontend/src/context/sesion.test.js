import { CLAVE_SESION, destinoSeguro, inicioDeRol, leerSesion } from "./sesion.js";

describe("leerSesion", () => {
	beforeEach(() => {
		window.sessionStorage.clear();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("sin sesion guardada devuelve null", () => {
		expect(leerSesion()).toBeNull();
	});

	it("devuelve la sesion guardada", () => {
		const sesion = { run: "123456785", rol: "CLIENTE", nombre: "Camila" };
		window.sessionStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));

		expect(leerSesion()).toEqual(sesion);
	});

	it("una sesion sin RUN o sin rol no cuenta", () => {
		window.sessionStorage.setItem(CLAVE_SESION, JSON.stringify({ run: "123456785" }));
		expect(leerSesion()).toBeNull();
	});

	it("con datos corruptos devuelve null y registra el error", () => {
		const error = vi.spyOn(console, "error").mockImplementation(() => {});
		window.sessionStorage.setItem(CLAVE_SESION, "{no es json");

		expect(leerSesion()).toBeNull();
		expect(error).toHaveBeenCalledTimes(1);
	});
});

describe("inicioDeRol", () => {
	it("cada rol llega a su vista", () => {
		expect(inicioDeRol("ADMIN")).toBe("/admin");
		expect(inicioDeRol("LOGISTICA")).toBe("/admin/productos");
		expect(inicioDeRol("CLIENTE")).toBe("/");
	});
});

describe("destinoSeguro", () => {
	it("acepta una ruta del mismo sitio", () => {
		expect(destinoSeguro("/carrito")).toBe("/carrito");
		expect(destinoSeguro("/productos?q=ram")).toBe("/productos?q=ram");
	});

	it("rechaza un destino de otro sitio o sin destino", () => {
		expect(destinoSeguro("//malo.com")).toBeNull();
		expect(destinoSeguro("https://malo.com")).toBeNull();
		expect(destinoSeguro("carrito")).toBeNull();
		expect(destinoSeguro(null)).toBeNull();
		expect(destinoSeguro(undefined)).toBeNull();
	});
});
