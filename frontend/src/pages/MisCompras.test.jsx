import { screen, within } from "@testing-library/react";
import { orden, ordenesDe, totalOrden, usuario } from "../data/datos.js";
import { precio } from "../utils/formato.js";
import { limpiarAlmacenamiento, renderConProviders, sesionDe } from "../testUtils.jsx";
import MisCompras from "./MisCompras.jsx";

const montar = (run) => renderConProviders(<MisCompras />, { sesion: sesionDe(usuario(run)) });

describe("MisCompras", () => {
	beforeEach(limpiarAlmacenamiento);

	it("lista solo las compras de la cuenta, de la mas reciente a la mas antigua (RF-24 CA1)", () => {
		montar("123456785"); // Camila: ORD-2026-0001 y ORD-2026-0004

		const filas = screen.getAllByRole("row").slice(1);
		expect(filas).toHaveLength(2);
		expect(within(filas[0]).getByText("ORD-2026-0004")).toBeInTheDocument();
		expect(within(filas[1]).getByText("ORD-2026-0001")).toBeInTheDocument();
		expect(screen.queryByText("ORD-2026-0002")).not.toBeInTheDocument();
	});

	it("resume la cantidad de compras y el gasto total", () => {
		montar("123456785");
		const gasto = ordenesDe("123456785").reduce((suma, o) => suma + totalOrden(o.numero), 0);

		expect(screen.getByText(`2 compras por un total de ${precio(gasto)}.`)).toBeInTheDocument();
	});

	it("usa el singular con una sola compra", () => {
		window.sessionStorage.setItem("ordenes", JSON.stringify([orden("ORD-2026-0001")]));
		montar("123456785");

		expect(screen.getByText(`1 compra por un total de ${precio(totalOrden("ORD-2026-0001"))}.`)).toBeInTheDocument();
	});

	it("cada compra enlaza a su boleta", () => {
		montar("123456785");

		const enlaces = screen.getAllByRole("link", { name: "Ver boleta" });
		expect(enlaces.map((a) => a.getAttribute("href"))).toEqual([
			"/mis-compras/ORD-2026-0004",
			"/mis-compras/ORD-2026-0001",
		]);
	});

	it("sin compras avisa y enlaza al catalogo (RF-24 CA2)", () => {
		window.sessionStorage.setItem("ordenes", "[]");
		montar("123456785");

		expect(screen.getByText("Todavia no has hecho compras con esta cuenta.")).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Ver el catalogo" })).toHaveAttribute("href", "/productos");
		expect(screen.queryByRole("table")).not.toBeInTheDocument();
	});
});
