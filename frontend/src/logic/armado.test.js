import { armadoReducer, elegidos, estadoInicial, opcionesDe, puedeAgregar, recorridoCompleto } from "./armado.js";

const aplicar = (estado, ...acciones) => acciones.reduce(armadoReducer, estado);
const registrar = (categoria, sku) => ({ tipo: "registrar", categoria, sku });

describe("estadoInicial", () => {
	it("parte sin modo, en el primer paso y sin elecciones", () => {
		expect(estadoInicial(3)).toEqual({ total: 3, modo: null, indice: 0, elecciones: [], agregado: false });
	});
});

describe("armadoReducer", () => {
	it("elige el modo y reinicia el recorrido", () => {
		const estado = aplicar(estadoInicial(3), { tipo: "modo", modo: "completo" });
		expect(estado.modo).toBe("completo");
		expect(estado.indice).toBe(0);
	});

	it("registrar guarda la eleccion y avanza", () => {
		const estado = aplicar(estadoInicial(3), registrar("cpu", "CPU-1"));
		expect(estado.elecciones).toEqual([{ categoria: "cpu", sku: "CPU-1" }]);
		expect(estado.indice).toBe(1);
	});

	it("no avanza mas alla del total", () => {
		const estado = aplicar(estadoInicial(1), registrar("cpu", "CPU-1"), registrar("cpu", "CPU-2"));
		expect(estado.indice).toBe(1);
	});

	it("cambiar un componente descarta lo elegido despues", () => {
		const base = aplicar(estadoInicial(3), registrar("cpu", "CPU-1"), registrar("placa", "MB-1"));
		const estado = aplicar(base, { tipo: "volver" }, { tipo: "volver" }, registrar("cpu", "CPU-2"));
		expect(estado.elecciones).toEqual([{ categoria: "cpu", sku: "CPU-2" }]);
	});

	it("omitir deja la categoria sin componente y avanza", () => {
		const estado = aplicar(estadoInicial(3), { tipo: "omitir", categoria: "cpu" });
		expect(estado.elecciones).toEqual([{ categoria: "cpu", sku: null }]);
		expect(estado.indice).toBe(1);
	});

	it("volver no baja de cero", () => {
		expect(aplicar(estadoInicial(3), { tipo: "volver" }).indice).toBe(0);
	});

	it("finalizar salta al final del recorrido", () => {
		expect(aplicar(estadoInicial(3), { tipo: "finalizar" }).indice).toBe(3);
	});

	it("seguir vuelve al primer paso sin elegir", () => {
		const base = aplicar(estadoInicial(3), registrar("cpu", "CPU-1"), { tipo: "volver" });
		expect(aplicar(base, { tipo: "seguir" }).indice).toBe(1);
	});

	it("agregado marca el armado como agregado al carrito", () => {
		expect(aplicar(estadoInicial(3), { tipo: "agregado" }).agregado).toBe(true);
	});

	it("reiniciar vuelve al estado inicial", () => {
		const base = aplicar(estadoInicial(3), { tipo: "modo", modo: "completo" }, registrar("cpu", "CPU-1"));
		expect(aplicar(base, { tipo: "reiniciar" })).toEqual(estadoInicial(3));
	});

	it("una accion desconocida deja el estado igual", () => {
		const estado = estadoInicial(3);
		expect(armadoReducer(estado, { tipo: "nada" })).toBe(estado);
	});
});

describe("consultas del recorrido", () => {
	it("elegidos deja fuera las categorias omitidas", () => {
		const estado = aplicar(estadoInicial(3), registrar("cpu", "CPU-1"), { tipo: "omitir", categoria: "placa" });
		expect(elegidos(estado)).toEqual([{ categoria: "cpu", sku: "CPU-1" }]);
	});

	it("recorridoCompleto es verdadero al llegar al total", () => {
		expect(recorridoCompleto(estadoInicial(2))).toBe(false);
		expect(recorridoCompleto(aplicar(estadoInicial(2), { tipo: "finalizar" }))).toBe(true);
	});
});

describe("puedeAgregar", () => {
	it("sin componentes elegidos no se puede agregar", () => {
		expect(puedeAgregar({ ...estadoInicial(2), modo: "modulos" })).toBe(false);
	});

	it("en modo modulos se puede agregar en cualquier momento", () => {
		const estado = aplicar(estadoInicial(3), { tipo: "modo", modo: "modulos" }, registrar("cpu", "CPU-1"));
		expect(puedeAgregar(estado)).toBe(true);
	});

	it("en equipo completo solo al terminar el recorrido", () => {
		const parcial = aplicar(estadoInicial(2), { tipo: "modo", modo: "completo" }, registrar("cpu", "CPU-1"));
		expect(puedeAgregar(parcial)).toBe(false);
		expect(puedeAgregar(aplicar(parcial, registrar("placa", "MB-1")))).toBe(true);
	});

	it("una vez agregado ya no se puede volver a agregar", () => {
		const estado = aplicar(estadoInicial(3), { tipo: "modo", modo: "modulos" }, registrar("cpu", "CPU-1"), { tipo: "agregado" });
		expect(puedeAgregar(estado)).toBe(false);
	});
});

describe("opcionesDe", () => {
	const categorias = [{ codigo: "cpu" }, { codigo: "placa" }];
	const productosDe = (codigo) => ({ cpu: [{ sku: "CPU-1" }], placa: [{ sku: "MB-1" }, { sku: "MB-2" }] })[codigo];
	const admisibles = (sku) => (sku === "CPU-1" ? ["MB-2"] : []);

	it("la primera categoria ofrece todos sus productos", () => {
		expect(opcionesDe(estadoInicial(2), categorias, 0, productosDe, admisibles)).toEqual([{ sku: "CPU-1" }]);
	});

	it("la siguiente ofrece solo los admisibles del componente anterior", () => {
		const estado = aplicar(estadoInicial(2), registrar("cpu", "CPU-1"));
		expect(opcionesDe(estado, categorias, 1, productosDe, admisibles)).toEqual([{ sku: "MB-2" }]);
	});

	it("si la categoria anterior se omitio ofrece la categoria completa", () => {
		const estado = aplicar(estadoInicial(2), { tipo: "omitir", categoria: "cpu" });
		expect(opcionesDe(estado, categorias, 1, productosDe, admisibles)).toHaveLength(2);
	});
});
