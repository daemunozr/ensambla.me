import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router";
import { ordenes, productos, totalOrden, usuarios, categorias, roles } from "../../data/datos.js";
import { enStockCritico } from "../../logic/stock.js";
import { precio } from "../../utils/formato.js";
import { SESION_ADMIN, limpiarAlmacenamiento, renderConProviders } from "../../testUtils.jsx";
import Resumen from "./Resumen.jsx";

const montar = () =>
	renderConProviders(
		<Routes>
			<Route path="/admin" element={<Resumen />} />
		</Routes>,
		{ ruta: "/admin", sesion: SESION_ADMIN },
	);
// El titulo de un indicador es un <p>; los accesos usan <h2> (y repiten algunos nombres).
const indicador = (titulo) => screen.getByText(titulo, { selector: "p" }).closest("article");

describe("admin / Resumen", () => {
	beforeEach(limpiarAlmacenamiento);

	it("muestra los indicadores del estado de los datos (RNF-08 CA5)", () => {
		montar();
		const vendido = ordenes().reduce((suma, o) => suma + totalOrden(o.numero), 0);

		expect(screen.getByRole("heading", { level: 1, name: "Resumen del sistema" })).toBeInTheDocument();
		expect(indicador("Productos en catalogo")).toHaveTextContent(`${productos().length}${categorias().length} categorias`);
		expect(indicador("En stock critico")).toHaveTextContent(String(productos().filter(enStockCritico).length));
		expect(indicador("Usuarios registrados")).toHaveTextContent(`${usuarios().length}${roles.length} roles`);
		expect(indicador("Ordenes")).toHaveTextContent(`${ordenes().length}${precio(vendido)} en total`);
	});

	it("los indicadores se recalculan con los datos de la sesion", () => {
		window.sessionStorage.setItem("ordenes", "[]");
		montar();

		expect(indicador("Ordenes")).toHaveTextContent(`0${precio(0)} en total`);
	});

	it("ofrece acceso a los seis mantenedores y consultas (RNF-08 CA5)", () => {
		montar();

		const esperados = {
			"Abrir productos": "/admin/productos",
			"Ver criticos": "/admin/productos/criticos",
			"Abrir categorias": "/admin/categorias",
			"Abrir usuarios": "/admin/usuarios",
			"Abrir ordenes": "/admin/ordenes",
			"Abrir reportes": "/admin/reportes",
		};
		Object.entries(esperados).forEach(([nombre, ruta]) =>
			expect(screen.getByRole("link", { name: nombre })).toHaveAttribute("href", ruta),
		);
		expect(screen.getAllByRole("article").length).toBe(4 + Object.keys(esperados).length);
	});
});
