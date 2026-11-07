import { screen } from "@testing-library/react";
import { blogs } from "../data/datos.js";
import { fecha } from "../utils/formato.js";
import { renderConProviders } from "../testUtils.jsx";
import Blogs from "./Blogs.jsx";

describe("Blogs", () => {
	it("lista los articulos con imagen, titulo y descripcion corta (RF-09 CA1)", () => {
		const { container } = renderConProviders(<Blogs />);

		expect(screen.getByRole("heading", { level: 1, name: "Blogs" })).toBeInTheDocument();
		expect(screen.getAllByRole("article")).toHaveLength(blogs.length);
		blogs.forEach((articulo) => {
			expect(screen.getByRole("heading", { level: 2, name: articulo.titulo })).toBeInTheDocument();
			expect(screen.getByText(articulo.resumen)).toBeInTheDocument();
			expect(screen.getByText(`${fecha(articulo.fecha)} · ${articulo.autor}`, { exact: false })).toBeInTheDocument();
		});
		expect(container.querySelectorAll("img.imagen-blog")).toHaveLength(blogs.length);
	});

	it("cada articulo enlaza a su detalle (RF-09 CA2)", () => {
		renderConProviders(<Blogs />);

		blogs.forEach((articulo) => {
			expect(screen.getByRole("link", { name: `Leer ${articulo.titulo}` })).toHaveAttribute("href", `/blogs/${articulo.slug}`);
		});
		expect(screen.getAllByRole("link", { name: "Leer el articulo" })).toHaveLength(blogs.length);
	});

	it("hay al menos dos articulos con detalle navegable (RF-09 CA2)", () => {
		renderConProviders(<Blogs />);

		expect(screen.getAllByRole("link", { name: "Leer el articulo" }).length).toBeGreaterThanOrEqual(2);
	});
});
