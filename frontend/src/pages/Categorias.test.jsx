import { screen, within } from "@testing-library/react";
import { categorias, productosDe } from "../data/datos.js";
import { limpiarAlmacenamiento, renderConProviders } from "../testUtils.jsx";
import Categorias from "./Categorias.jsx";

const seccion = (nombre) => screen.getByRole("heading", { level: 2, name: nombre }).closest("section");

describe("Categorias", () => {
	beforeEach(limpiarAlmacenamiento);

	it("agrupa los productos por categoria, una seccion por cada una (RF-19 CA1)", () => {
		renderConProviders(<Categorias />);

		expect(screen.getByRole("heading", { level: 1, name: "Categorias" })).toBeInTheDocument();
		expect(screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)).toEqual(categorias().map((c) => c.nombre));
	});

	it("adelanta solo los tres primeros productos de cada categoria", () => {
		renderConProviders(<Categorias />);
		const cpu = categorias().find((c) => c.codigo === "cpu");

		const enlaces = within(seccion(cpu.nombre)).getAllByRole("link", { name: /^Ver el detalle de/ });
		expect(enlaces).toHaveLength(3);
		expect(productosDe("cpu").length).toBeGreaterThanOrEqual(3);
	});

	it("el enlace «Ver los N productos» lleva al listado de la categoria (RF-19 CA1)", () => {
		renderConProviders(<Categorias />);
		const ram = categorias().find((c) => c.codigo === "ram");

		const enlace = within(seccion(ram.nombre)).getByRole("link", { name: `Ver los ${productosDe("ram").length} productos` });
		expect(enlace).toHaveAttribute("href", "/productos?categoria=ram");
	});

	it("con un solo producto el enlace dice «Ver el producto»", () => {
		const gpu = productosDe("gpu");
		window.sessionStorage.setItem("productos", JSON.stringify([...productosDe("cpu"), gpu[0]]));
		renderConProviders(<Categorias />);
		const categoria = categorias().find((c) => c.codigo === "gpu");

		expect(within(seccion(categoria.nombre)).getByRole("link", { name: "Ver el producto" })).toBeInTheDocument();
	});

	it("una categoria sin productos muestra un aviso y no ofrece enlace (RF-19 CA2)", () => {
		window.sessionStorage.setItem("productos", JSON.stringify(productosDe("cpu")));
		renderConProviders(<Categorias />);
		const gpu = categorias().find((c) => c.codigo === "gpu");

		const sec = seccion(gpu.nombre);
		expect(within(sec).getByText(`Todavia no hay productos en ${gpu.nombre}.`)).toBeInTheDocument();
		expect(within(sec).queryByRole("link")).not.toBeInTheDocument();
	});

	it("incluye las categorias nuevas que crea el administrador (RF-25 CA3)", () => {
		window.sessionStorage.setItem("categorias", JSON.stringify([...categorias(), { codigo: "sillas", nombre: "Sillas gamer", orden: null }]));
		renderConProviders(<Categorias />);

		expect(within(seccion("Sillas gamer")).getByText("Todavia no hay productos en Sillas gamer.")).toBeInTheDocument();
	});
});
