import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router";
import { blogs } from "../data/datos.js";
import { renderConProviders } from "../testUtils.jsx";
import Blog from "./Blog.jsx";

const montar = (slug) =>
	renderConProviders(
		<Routes>
			<Route path="/blogs/:slug" element={<Blog />} />
		</Routes>,
		{ ruta: `/blogs/${slug}` },
	);

describe("Blog", () => {
	it("muestra el detalle con imagen, titulo y descripcion larga (RF-09 CA2)", () => {
		const articulo = blogs[0];
		const { container } = montar(articulo.slug);

		expect(screen.getByRole("heading", { level: 1, name: articulo.titulo })).toBeInTheDocument();
		expect(container.querySelector("img.imagen-articulo")).toBeInTheDocument();
		expect(screen.getByText(articulo.resumen)).toBeInTheDocument();
		articulo.cuerpo.forEach((parrafo) => expect(screen.getByText(parrafo)).toBeInTheDocument());
	});

	it("cada articulo del listado tiene su detalle", () => {
		blogs.forEach((articulo) => {
			const { unmount } = montar(articulo.slug);
			expect(screen.getByRole("heading", { level: 1, name: articulo.titulo })).toBeInTheDocument();
			unmount();
		});
	});

	it("ofrece volver al listado", () => {
		montar(blogs[0].slug);

		expect(screen.getByRole("link", { name: "Volver a los blogs" })).toHaveAttribute("href", "/blogs");
	});

	it("un identificador inexistente muestra «Articulo no encontrado»", () => {
		montar("no-existe");

		expect(screen.getByRole("heading", { level: 1, name: "Articulo no encontrado" })).toBeInTheDocument();
		expect(screen.getByText("no-existe")).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Volver a los blogs" })).toHaveAttribute("href", "/blogs");
	});
});
