import { crearColeccion } from "./coleccion.js";

const SEMILLA = [
	{ id: "a", valor: 1 },
	{ id: "b", valor: 2 },
];

describe("crearColeccion", () => {
	let coleccion;

	beforeEach(() => {
		window.sessionStorage.clear();
		coleccion = crearColeccion({ clave: "prueba", semilla: SEMILLA, id: "id" });
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("sin nada guardado lista la semilla", () => {
		expect(coleccion.listar()).toEqual(SEMILLA);
	});

	it("lista una copia: modificarla no cambia la semilla", () => {
		coleccion.listar()[0].valor = 99;
		expect(SEMILLA[0].valor).toBe(1);
	});

	it("obtener y existe buscan por el identificador", () => {
		expect(coleccion.obtener("b")).toEqual({ id: "b", valor: 2 });
		expect(coleccion.obtener("z")).toBeUndefined();
		expect(coleccion.existe("a")).toBe(true);
		expect(coleccion.existe("z")).toBe(false);
	});

	it("insertar agrega el registro y lo guarda en sessionStorage", () => {
		coleccion.insertar({ id: "c", valor: 3 });

		expect(coleccion.listar()).toHaveLength(3);
		expect(JSON.parse(window.sessionStorage.getItem("prueba"))).toHaveLength(3);
	});

	it("insertarVarios agrega todos los registros", () => {
		coleccion.insertarVarios([{ id: "c" }, { id: "d" }]);
		expect(coleccion.listar().map((r) => r.id)).toEqual(["a", "b", "c", "d"]);
	});

	it("reemplazar cambia solo el registro indicado", () => {
		coleccion.reemplazar("a", { id: "a", valor: 10 });
		expect(coleccion.listar()).toEqual([
			{ id: "a", valor: 10 },
			{ id: "b", valor: 2 },
		]);
	});

	it("quitar elimina el registro indicado", () => {
		coleccion.quitar("a");
		expect(coleccion.listar()).toEqual([{ id: "b", valor: 2 }]);
	});

	it("los cambios no tocan la semilla, asi que otra coleccion sin almacenamiento vuelve a ella", () => {
		coleccion.quitar("a");
		window.sessionStorage.clear();
		expect(coleccion.listar()).toEqual(SEMILLA);
	});

	it("acepta una funcion para calcular una clave compuesta", () => {
		const compuesta = crearColeccion({
			clave: "compuesta",
			semilla: [{ orden: "O1", producto: "P1" }],
			id: (registro) => `${registro.orden}|${registro.producto}`,
		});

		expect(compuesta.existe("O1|P1")).toBe(true);
		expect(compuesta.existe("O1|P2")).toBe(false);
	});

	describe("cuando el almacenamiento falla", () => {
		it("con JSON corrupto vuelve a la semilla y registra el error", () => {
			const error = vi.spyOn(console, "error").mockImplementation(() => {});
			window.sessionStorage.setItem("prueba", "{no es json");

			expect(coleccion.listar()).toEqual(SEMILLA);
			expect(error).toHaveBeenCalledTimes(1);
		});

		it("si lo guardado no es un arreglo vuelve a la semilla", () => {
			window.sessionStorage.setItem("prueba", JSON.stringify({ id: "a" }));
			expect(coleccion.listar()).toEqual(SEMILLA);
		});

		it("si no se puede escribir registra el error y devuelve la lista", () => {
			const error = vi.spyOn(console, "error").mockImplementation(() => {});
			vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
				throw new Error("cuota excedida");
			});

			const lista = coleccion.insertar({ id: "c" });

			expect(lista).toHaveLength(3);
			expect(error).toHaveBeenCalledTimes(1);
		});
	});
});
