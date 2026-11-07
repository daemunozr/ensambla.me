/*
 * Ramas de respaldo que las demas pruebas no alcanzan: valores ausentes,
 * empates de ordenamiento y fallos del almacenamiento del navegador.
 */
import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import Boleta from "./components/Boleta.jsx";
import ModalConfirmacion from "./components/ModalConfirmacion.jsx";
import TablaOrdenes from "./components/TablaOrdenes.jsx";
import Nav from "./components/layout/Nav.jsx";
import { useDatos } from "./context/datos.js";
import { useSesion } from "./context/sesion.js";
import SesionProvider from "./context/SesionProvider.jsx";
import { itemOrden, itemsDeOrden, nombreRegionDeComuna, orden, ordenes, totalOrden } from "./data/datos.js";
import { useFormulario } from "./hooks/useFormulario.js";
import { agregarArmado, agregarProducto, cambiarCantidad } from "./logic/carrito.js";
import { topClientes } from "./logic/reportes.js";
import { reglas } from "./utils/validaciones.js";
import { limpiarAlmacenamiento, renderConProviders } from "./testUtils.jsx";

beforeEach(limpiarAlmacenamiento);
afterEach(() => vi.restoreAllMocks());

describe("Boleta con datos incompletos", () => {
	it("sin costo de envio ni tipo de entrega conocido muestra el total de los items y «—»", () => {
		render(<Boleta orden={{ ...orden("ORD-2026-0001"), costoEnvio: undefined, entrega: "DRON" }} items={itemsDeOrden("ORD-2026-0001")} />);

		expect(screen.getAllByText("—").length).toBeGreaterThan(0);
	});
});

describe("ModalConfirmacion con otras teclas", () => {
	it("una tecla distinta de Escape no lo cierra", async () => {
		const onCancelar = vi.fn();
		render(
			<ModalConfirmacion abierto titulo="Eliminar" onConfirmar={vi.fn()} onCancelar={onCancelar}>
				<p>Contenido</p>
			</ModalConfirmacion>,
		);

		await userEvent.keyboard("a");

		expect(onCancelar).not.toHaveBeenCalled();
	});
});

describe("TablaOrdenes con un producto que ya no existe", () => {
	it("muestra el SKU en lugar del nombre", () => {
		window.sessionStorage.setItem(
			"itemsOrden",
			JSON.stringify([{ orden: "ORD-2026-0001", producto: "SKU-FANTASMA", cantidad: 2, precioUnitario: 1000 }]),
		);

		render(
			<MemoryRouter>
				<TablaOrdenes ordenes={[orden("ORD-2026-0001")]} rutaDetalle={(numero) => `/ordenes/${numero}`} />
			</MemoryRouter>,
		);

		expect(screen.getByText(/SKU-FANTASMA \(x2\)/)).toBeInTheDocument();
	});
});

describe("Nav sin el campo de busqueda", () => {
	it("enviar el formulario sin campo «q» lleva al catalogo completo", () => {
		const { container } = renderConProviders(<Nav />);
		const formulario = container.querySelector("form");
		formulario.querySelector('[name="q"]').remove();

		fireEvent.submit(formulario);

		expect(screen.getByRole("navigation", { name: "Navegacion principal" })).toBeInTheDocument();
	});
});

describe("useDatos fuera de su proveedor", () => {
	it("lanza un error que explica como usarlo", () => {
		vi.spyOn(console, "error").mockImplementation(() => {});

		expect(() => renderHook(() => useDatos())).toThrow("useDatos debe usarse dentro de <DatosProvider>");
	});
});

describe("SesionProvider con el almacenamiento fallando", () => {
	const montar = () =>
		renderHook(() => useSesion(), {
			wrapper: ({ children }) => <SesionProvider>{children}</SesionProvider>,
		});

	it("cerrar la sesion tolera que no se pueda limpiar el almacenamiento", () => {
		const error = vi.spyOn(console, "error").mockImplementation(() => {});
		const { result } = montar();
		act(() => {
			result.current.iniciar("admin@duoc.cl", "admin1234");
		});
		vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
			throw new Error("bloqueado");
		});

		act(() => result.current.cerrar());

		expect(result.current.sesion).toBeNull();
		expect(error).toHaveBeenCalledWith("sesion: no se pudo limpiar la sesion", expect.any(Error));
	});

	it("actualizar la sesion tolera que no se pueda guardar en el almacenamiento", () => {
		const error = vi.spyOn(console, "error").mockImplementation(() => {});
		const { result } = montar();
		act(() => {
			result.current.iniciar("admin@duoc.cl", "admin1234");
		});
		vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
			throw new Error("lleno");
		});

		act(() => result.current.actualizar({ nombre: "Otro", apellidos: "Nombre", correo: "otro@duoc.cl" }));

		expect(result.current.sesion.nombre).toBe("Otro");
		expect(error).toHaveBeenCalledWith("sesion: no se pudo guardar la sesion", expect.any(Error));
	});
});

describe("datos con referencias que no existen", () => {
	it("el item de una orden se busca por orden y producto", () => {
		const primero = itemsDeOrden("ORD-2026-0001")[0];

		expect(itemOrden(`ORD-2026-0001|${primero.producto}`)).toEqual(primero);
		expect(itemOrden("ORD-2026-0001|SKU-FANTASMA")).toBeUndefined();
	});

	it("una comuna desconocida no tiene region", () => {
		expect(nombreRegionDeComuna("XX-99")).toBe("");
	});

	it("el total de una orden inexistente es cero", () => {
		expect(totalOrden("ORD-INEXISTENTE")).toBe(0);
		expect(ordenes().length).toBeGreaterThan(0);
	});
});

describe("useFormulario con campos fuera de los valores iniciales", () => {
	const evento = (valor) => ({ target: { value: valor } });

	it("un campo sin valor inicial se registra vacio y no se marca como valido", () => {
		const { result } = renderHook(() => useFormulario({}, { nota: [reglas.maximo(5)] }));

		expect(result.current.registrar("nota").value).toBe("");

		act(() => result.current.registrar("nota").onBlur(evento(undefined)));

		expect(result.current.estado("nota")).toBe("");
	});

	it("al enviar deja intactos los valores que no son texto", () => {
		const alEnviar = vi.fn();
		const { result } = renderHook(() => useFormulario({ edad: 30, nombre: " Ana " }, {}));
		const formulario = { elements: { namedItem: () => null } };

		act(() => result.current.enviar(alEnviar)({ preventDefault: vi.fn(), currentTarget: formulario }));

		expect(alEnviar).toHaveBeenCalledWith({ edad: 30, nombre: "Ana" });
	});
});

describe("carrito: casos limite", () => {
	const buscar = (sku) => ({ A: { sku: "A", nombre: "Pieza A", precio: 100, stock: 5 } })[sku];

	it("agregar de nuevo un producto suelto suma a su linea", () => {
		const lineas = [{ linea: 1, producto: "A", cantidad: 1, armado: null }];

		const resultado = agregarProducto(lineas, "A", 2, buscar);

		expect(resultado.lineas).toEqual([{ linea: 1, producto: "A", cantidad: 3, armado: null }]);
	});

	it("agregar un producto distinto deja intactas las demas lineas", () => {
		const catalogo = (sku) => ({ A: { sku: "A", nombre: "A", precio: 1, stock: 5 }, B: { sku: "B", nombre: "B", precio: 1, stock: 5 } })[sku];
		const lineas = [
			{ linea: 1, producto: "A", cantidad: 1, armado: null },
			{ linea: 2, producto: "B", cantidad: 1, armado: null },
		];

		const resultado = agregarProducto(lineas, "B", 1, catalogo);

		expect(resultado.lineas[0].cantidad).toBe(1);
		expect(resultado.lineas[1].cantidad).toBe(2);
	});

	it("un armado ignora los SKU que ya no existen", () => {
		const resultado = agregarArmado([], ["A", "FANTASMA"], "ARM-1", buscar);

		expect(resultado.ok).toBe(true);
		expect(resultado.lineas).toHaveLength(1);
	});

	it("cambiar la cantidad deja intactas las otras lineas", () => {
		const lineas = [
			{ linea: 1, producto: "A", cantidad: 1, armado: null },
			{ linea: 2, producto: "A", cantidad: 1, armado: "ARM-1" },
		];

		const resultado = cambiarCantidad(lineas, 1, 2, buscar);

		expect(resultado.lineas[0].cantidad).toBe(2);
		expect(resultado.lineas[1].cantidad).toBe(1);
	});
});

describe("topClientes con empates", () => {
	const ORDEN = (numero, cliente, nombre, fecha) => ({ numero, cliente, nombre, correo: `${nombre}@gmail.com`, fecha, costoEnvio: 0 });
	const ITEM = (orden, cantidad) => ({ orden, producto: "A", cantidad, precioUnitario: 100 });

	it("ordena las compras de un mismo dia por numero", () => {
		const ordenesDePrueba = [ORDEN("ORD-10", "1", "Ana", "2026-01-01"), ORDEN("ORD-9", "1", "Ana", "2026-01-01")];

		const [cliente] = topClientes(ordenesDePrueba, [ITEM("ORD-9", 1), ITEM("ORD-10", 1)]);

		expect(cliente.ordenes).toBe(2);
	});

	it("con igual gasto desempata por cantidad de ordenes y luego por nombre", () => {
		const ordenesDePrueba = [
			ORDEN("ORD-1", "1", "Zoe", "2026-01-01"),
			ORDEN("ORD-2", "2", "Ana", "2026-01-02"),
			ORDEN("ORD-3", "3", "Eva", "2026-01-03"),
			ORDEN("ORD-4", "3", "Eva", "2026-01-04"),
		];
		const items = [ITEM("ORD-1", 2), ITEM("ORD-2", 2), ITEM("ORD-3", 1), ITEM("ORD-4", 1)];

		expect(topClientes(ordenesDePrueba, items).map((c) => c.nombre)).toEqual(["Eva", "Ana", "Zoe"]);
	});
});

describe("reglas de validacion con valores ausentes", () => {
	const reglasConValor = [
		reglas.requerido(),
		reglas.maximo(3),
		reglas.minimo(3),
		reglas.run(),
		reglas.correo(),
		reglas.contrasena(),
		reglas.numeroMinimo(1),
		reglas.tarjeta(),
		reglas.vencimiento(),
		reglas.cvv(),
		reglas.numeroMaximo(9),
		reglas.entero(),
		reglas.seleccion(),
		reglas.patron(/^a$/, "Debe ser a."),
	];

	it.each([undefined, null])("tratan %s como un campo vacio", (valor) => {
		const mensajes = reglasConValor.map((regla) => regla(valor));

		expect(mensajes[0]).toBe("Este campo es obligatorio.");
		expect(mensajes[12]).toBe("Selecciona una opcion.");
		expect([...mensajes.slice(1, 12), mensajes[13]].every((mensaje) => mensaje === "")).toBe(true);
	});
});
