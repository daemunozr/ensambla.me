import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import { itemsOrden, ordenes, productos } from "../../data/datos.js";
import { resumenVentas, valorInventario } from "../../logic/reportes.js";
import { enStockCritico } from "../../logic/stock.js";
import { precio } from "../../utils/formato.js";
import { SESION_ADMIN, limpiarAlmacenamiento, renderConProviders } from "../../testUtils.jsx";
import Reportes from "./Reportes.jsx";

const montar = () =>
	renderConProviders(
		<Routes>
			<Route path="/admin/reportes" element={<Reportes />} />
		</Routes>,
		{ ruta: "/admin/reportes", sesion: SESION_ADMIN },
	);
const indicador = (titulo) => screen.getByText(titulo, { selector: "p" }).closest("article");
const seccion = (titulo) => screen.getByRole("heading", { level: 2, name: titulo }).closest("section");
const fecha = (etiqueta, valor) => userEvent.type(screen.getByLabelText(etiqueta), valor);

describe("admin / Reportes", () => {
	beforeEach(limpiarAlmacenamiento);

	it("resume ordenes, ingresos, envios, unidades y ticket promedio (RF-27 CA2)", () => {
		montar();
		const r = resumenVentas(ordenes(), itemsOrden());

		expect(screen.getByRole("heading", { level: 1, name: "Reportes" })).toBeInTheDocument();
		expect(indicador("Ingresos")).toHaveTextContent(`${precio(r.ingresos)}${precio(r.envios)} en envios`);
		expect(indicador("Ordenes")).toHaveTextContent(String(r.ordenes));
		expect(indicador("Ticket promedio")).toHaveTextContent(precio(r.ticketPromedio));
		expect(indicador("Unidades vendidas")).toHaveTextContent(String(r.unidades));
		expect(r.ordenes).toBe(7);
	});

	it("muestra ventas por mes con su cantidad de ordenes (RF-27 CA3)", () => {
		montar();

		const filas = within(within(seccion("Ventas por mes")).getByRole("table")).getAllByRole("row").slice(1);
		expect(filas).toHaveLength(2);
		expect(filas[0]).toHaveTextContent("septiembre de 2026");
		expect(filas[0]).toHaveTextContent("4 ordenes");
		expect(filas[1]).toHaveTextContent("octubre de 2026");
		expect(filas[1]).toHaveTextContent("3 ordenes");
	});

	it("muestra ventas por categoria con sus unidades (RF-27 CA3)", () => {
		montar();

		const tabla = within(seccion("Ventas por categoria")).getByRole("table");
		expect(within(tabla).getByText("Procesadores (CPU)")).toBeInTheDocument();
		expect(within(tabla).getAllByRole("progressbar").length).toBeGreaterThan(3);
	});

	it("muestra los cinco productos mas vendidos (RF-27 CA3)", () => {
		montar();

		const filas = within(within(seccion("Productos mas vendidos")).getByRole("table")).getAllByRole("row").slice(1);
		expect(filas).toHaveLength(5);
	});

	it("muestra los mejores clientes y agrupa al invitado por su correo (RF-27 CA3)", () => {
		montar();

		const tabla = within(seccion("Mejores clientes")).getByRole("table");
		expect(within(tabla).getByText("Sofia Contreras Pino")).toBeInTheDocument();
		expect(within(tabla).getByText(/Invitado · 1 orden/)).toBeInTheDocument();
		expect(within(tabla).getByText(/RUN 123456785 · 2 ordenes/)).toBeInTheDocument();
	});

	it("muestra el inventario valorizado a precio de lista y los productos criticos (RF-27 CA4)", () => {
		montar();
		const inv = valorInventario(productos());

		expect(indicador("Valor del inventario")).toHaveTextContent(`${precio(inv.valor)}A precio de lista`);
		expect(indicador("Unidades en stock")).toHaveTextContent(`${inv.unidades}${inv.productos} productos`);
		expect(indicador("En stock critico")).toHaveTextContent(String(productos().filter(enStockCritico).length));
		expect(screen.getByRole("link", { name: "Ver los productos criticos" })).toHaveAttribute("href", "/admin/productos/criticos");
	});

	describe("periodo (RF-27 CA1)", () => {
		it("acotar con «Desde» deja solo las ordenes desde esa fecha", async () => {
			montar();

			await fecha("Desde", "2026-10-01");

			expect(indicador("Ordenes")).toHaveTextContent("3");
			expect(within(seccion("Ventas por mes")).getAllByRole("row")).toHaveLength(2);
		});

		it("acotar con «Hasta» deja solo las ordenes hasta esa fecha", async () => {
			montar();

			await fecha("Hasta", "2026-09-18");

			expect(indicador("Ordenes")).toHaveTextContent("2");
		});

		it("las fechas son inclusivas", async () => {
			montar();

			await fecha("Desde", "2026-09-12");
			await fecha("Hasta", "2026-09-12");

			expect(indicador("Ordenes")).toHaveTextContent("1");
		});

		it("un rango invertido se avisa y no hay ordenes", async () => {
			montar();

			await fecha("Desde", "2026-10-10");
			await fecha("Hasta", "2026-09-01");

			expect(screen.getByRole("alert")).toHaveTextContent("La fecha inicial no puede ser posterior a la final");
			expect(screen.getByText("No hay ordenes en el periodo elegido.")).toBeInTheDocument();
			expect(indicador("Ordenes")).toHaveTextContent("0");
			expect(screen.queryByRole("heading", { name: "Ventas por mes" })).not.toBeInTheDocument();
		});

		it("un periodo sin ordenes oculta los reportes de ventas pero mantiene el inventario", async () => {
			montar();

			await fecha("Desde", "2027-01-01");

			expect(screen.getByText("No hay ordenes en el periodo elegido.")).toBeInTheDocument();
			expect(screen.getByRole("heading", { name: "Inventario" })).toBeInTheDocument();
		});

		it("«Limpiar periodo» vuelve a mostrar todas las ordenes", async () => {
			montar();
			await fecha("Desde", "2026-10-01");

			await userEvent.click(screen.getByRole("button", { name: "Limpiar periodo" }));

			expect(indicador("Ordenes")).toHaveTextContent("7");
			expect(screen.getByLabelText("Desde")).toHaveValue("");
		});
	});

	it("un producto vendido que ya no esta en el catalogo se agrupa como «Sin categoria»", () => {
		window.sessionStorage.setItem("productos", JSON.stringify(productos().filter((p) => p.sku !== "GPU-RTX4060")));
		montar();

		expect(within(seccion("Ventas por categoria")).getByText("Sin categoria")).toBeInTheDocument();
		expect(screen.getByText(/«Sin categoria» reune productos vendidos/)).toBeInTheDocument();
	});
});
