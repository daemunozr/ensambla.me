import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { admisibles, categoriasDeArmado, producto, productosDe } from "../data/datos.js";
import { precioVigente } from "../logic/precios.js";
import { precio } from "../utils/formato.js";
import { limpiarAlmacenamiento, renderConProviders } from "../testUtils.jsx";
import Armado from "./Armado.jsx";

const CATEGORIAS = categoriasDeArmado();
const nombreDe = (sku) => producto(sku).nombre;

const montar = () => renderConProviders(<Armado />);
const clic = (nombre) => userEvent.click(screen.getByRole("button", { name: nombre }));
const radios = () => screen.queryAllByRole("radio");
const pasos = () => within(document.querySelector("ol.pasos-armado")).getAllByRole("listitem");
const carrito = () => JSON.parse(window.localStorage.getItem("carrito") ?? "[]");

/** Escoge un componente del paso actual (el primero con stock si no se indica) y continua. */
async function elegir(sku) {
	const opcion = sku ? screen.getByRole("radio", { name: nombreDe(sku) }) : radios().find((r) => !r.disabled);
	await userEvent.click(opcion);
	await userEvent.click(screen.getByRole("button", { name: /^(Continuar|Ver el resumen)$/ }));
	return opcion.value;
}

describe("Armado", () => {
	beforeEach(limpiarAlmacenamiento);

	it("al abrir pide elegir el modo y aun no muestra pasos (RF-07 CA1)", () => {
		montar();

		expect(screen.getByRole("heading", { level: 1, name: "Asistente de armado" })).toBeInTheDocument();
		expect(screen.getByRole("heading", { name: "Como quieres armarlo" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Armar equipo completo" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Armar por modulos" })).toBeInTheDocument();
		expect(document.querySelector("ol.pasos-armado")).toBeNull();
		expect(radios()).toHaveLength(0);
	});

	it("el equipo completo muestra una categoria a la vez, en orden (RF-07 CA1)", async () => {
		montar();

		await clic("Armar equipo completo");

		expect(screen.getByText("Equipo completo")).toBeInTheDocument();
		expect(screen.getByRole("heading", { name: `Paso 1 de ${CATEGORIAS.length}: ${CATEGORIAS[0].nombre}` })).toBeInTheDocument();
		expect(pasos().map((p) => p.textContent)).toEqual(CATEGORIAS.map((c) => c.nombre));
		expect(pasos()[0]).toHaveClass("paso-actual");
		expect(radios()).toHaveLength(productosDe(CATEGORIAS[0].codigo).length);
	});

	it("continuar sin escoger muestra un aviso y se queda en el paso", async () => {
		montar();
		await clic("Armar equipo completo");

		await clic("Continuar");

		expect(screen.getByText("Selecciona un componente para continuar.")).toBeInTheDocument();
		expect(screen.getByRole("heading", { name: /^Paso 1 de/ })).toBeInTheDocument();
	});

	it("escoger un componente filtra la categoria siguiente por la tabla de compatibilidad (RF-07 CA2)", async () => {
		montar();
		await clic("Armar equipo completo");

		await elegir("CPU-R5-7600");

		expect(screen.getByRole("heading", { name: /^Paso 2 de/ })).toBeInTheDocument();
		const esperadas = admisibles("CPU-R5-7600").map(nombreDe).sort();
		expect(radios().map((r) => r.closest(".form-check").textContent).sort()).toEqual(esperadas);
		expect(screen.getByText(nombreDe("CPU-R5-7600"), { selector: "strong" })).toBeInTheDocument();
		// El CPU de otro socket no deja pasar sus placas.
		expect(screen.queryByRole("radio", { name: nombreDe("MB-B760-PLUS") })).not.toBeInTheDocument();
	});

	it("los pasos se marcan como hechos, y «Volver» recupera la eleccion anterior", async () => {
		montar();
		await clic("Armar equipo completo");
		await elegir("CPU-R5-7600");

		expect(pasos()[0]).toHaveClass("paso-listo");
		expect(pasos()[1]).toHaveClass("paso-actual");

		await clic("Volver");

		expect(screen.getByRole("heading", { name: /^Paso 1 de/ })).toBeInTheDocument();
		expect(screen.getByRole("radio", { name: nombreDe("CPU-R5-7600") })).toBeChecked();
	});

	it("en el primer paso no hay «Volver», y en equipo completo no se puede omitir ni finalizar", async () => {
		montar();
		await clic("Armar equipo completo");

		expect(screen.queryByRole("button", { name: "Volver" })).not.toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Omitir esta categoria" })).not.toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Finalizar aqui" })).not.toBeInTheDocument();
	});

	it("un componente sin stock aparece marcado y no se puede escoger (RF-07 CA7)", async () => {
		const sinStock = { ...producto("CPU-R5-7600"), stock: 0 };
		window.sessionStorage.setItem("productos", JSON.stringify([sinStock, ...productosDe("cpu").filter((p) => p.sku !== sinStock.sku), ...productosDe("placa")]));
		montar();
		await clic("Armar equipo completo");

		const opcion = screen.getByRole("radio", { name: `${nombreDe("CPU-R5-7600")} (sin stock)` });
		expect(opcion).toBeDisabled();
		expect(opcion).not.toBeChecked();
	});

	it("recorridas todas las categorias se agrega el conjunto completo al carrito (RF-07 CA4 y CA5)", async () => {
		montar();
		await clic("Armar equipo completo");

		const elegidos = [];
		for (let i = 0; i < CATEGORIAS.length; i++) {
			if (i === CATEGORIAS.length - 1) expect(screen.getByRole("button", { name: "Ver el resumen" })).toBeInTheDocument();
			elegidos.push(await elegir());
		}

		expect(screen.getByRole("heading", { name: "Resumen del armado" })).toBeInTheDocument();
		const total = elegidos.reduce((suma, sku) => suma + precioVigente(producto(sku)), 0);
		expect(screen.getByText(`Precio del conjunto (${CATEGORIAS.length} componentes)`)).toBeInTheDocument();
		expect(screen.getAllByText(precio(total)).length).toBeGreaterThan(0);

		await clic("Agregar el armado al carrito");

		expect(screen.getByText("El armado se agrego al carrito como un conjunto.")).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Ir al carrito" })).toHaveAttribute("href", "/carrito");
		const lineas = carrito();
		expect(lineas).toHaveLength(CATEGORIAS.length);
		expect(new Set(lineas.map((l) => l.armado)).size).toBe(1);
		expect(lineas[0].armado).toMatch(/^ARM-/);
	});

	it("«Armar otro equipo» vuelve al selector de modo", async () => {
		montar();
		await clic("Armar por modulos");
		await elegir();
		await clic("Finalizar aqui");
		await clic("Agregar el armado al carrito");

		await clic("Armar otro equipo");

		expect(screen.getByRole("heading", { name: "Como quieres armarlo" })).toBeInTheDocument();
		expect(carrito()).toHaveLength(1);
	});

	describe("por modulos", () => {
		it("permite omitir categorias y finalizar antes con lo elegido (RF-07 CA3)", async () => {
			montar();
			await clic("Armar por modulos");

			expect(screen.queryByRole("button", { name: "Finalizar aqui" })).not.toBeInTheDocument();
			await clic("Omitir esta categoria"); // CPU
			await clic("Omitir esta categoria"); // placa
			await clic("Omitir esta categoria"); // RAM
			expect(screen.getByRole("heading", { name: /^Paso 4 de/ })).toBeInTheDocument();
			const ssd = await elegir("SSD-NVME-1TB");
			await clic("Finalizar aqui");

			expect(ssd).toBe("SSD-NVME-1TB");
			expect(screen.getByText("Precio del conjunto (1 componente)")).toBeInTheDocument();
			await clic("Agregar el armado al carrito");
			expect(carrito().map((l) => l.producto)).toEqual(["SSD-NVME-1TB"]);
		});

		it("tras omitir una categoria se ofrece la siguiente completa, sin filtrar", async () => {
			montar();
			await clic("Armar por modulos");
			await clic("Omitir esta categoria");

			expect(screen.getByRole("heading", { name: /^Paso 2 de/ })).toBeInTheDocument();
			expect(radios()).toHaveLength(productosDe("placa").length);
			expect(screen.queryByText(/Filtrado segun tu eleccion anterior/)).not.toBeInTheDocument();
			expect(pasos()[0]).toHaveClass("paso-omitido");
		});

		it("tras volver atras, «Seguir eligiendo» retoma desde el paso que sigue a lo elegido", async () => {
			montar();
			await clic("Armar por modulos");
			await elegir("CPU-R5-7600");
			await clic("Volver");
			expect(screen.getByRole("heading", { name: /^Paso 1 de/ })).toBeInTheDocument();

			await clic("Seguir eligiendo");

			expect(screen.getByRole("heading", { name: /^Paso 2 de/ })).toBeInTheDocument();
		});

		it("omitirlo todo no deja nada que agregar", async () => {
			montar();
			await clic("Armar por modulos");
			for (let i = 0; i < CATEGORIAS.length; i++) await clic("Omitir esta categoria");

			expect(screen.queryByRole("heading", { name: "Resumen del armado" })).not.toBeInTheDocument();
			expect(carrito()).toHaveLength(0);
		});
	});

	it("si al finalizar falta stock, el armado no se agrega y el aviso nombra el componente (RF-07 CA7)", async () => {
		montar();
		await clic("Armar por modulos");
		await elegir("CPU-R5-7600");
		await clic("Finalizar aqui");
		// El stock baja desde el panel mientras el cliente decide.
		window.sessionStorage.setItem("productos", JSON.stringify([{ ...producto("CPU-R5-7600"), stock: 0 }]));

		await clic("Agregar el armado al carrito");

		expect(screen.getByText(/Sin stock suficiente para: AMD Ryzen 5 7600/)).toBeInTheDocument();
		expect(screen.queryByText("El armado se agrego al carrito como un conjunto.")).not.toBeInTheDocument();
		expect(carrito()).toHaveLength(0);
		expect(screen.getByRole("button", { name: "Agregar el armado al carrito" })).toBeInTheDocument();
	});

	it("«Empezar de nuevo» descarta lo elegido y vuelve al selector", async () => {
		montar();
		await clic("Armar equipo completo");
		await elegir("CPU-R5-7600");

		await clic("Empezar de nuevo");

		expect(screen.getByRole("heading", { name: "Como quieres armarlo" })).toBeInTheDocument();
		expect(document.querySelector("ol.pasos-armado")).toBeNull();
	});
});
