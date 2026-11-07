import { screen } from "@testing-library/react";
import { categorias } from "../../data/datos.js";
import { limpiarAlmacenamiento, renderConProviders } from "../../testUtils.jsx";
import Aside from "./Aside.jsx";

describe("Aside", () => {
	beforeEach(limpiarAlmacenamiento);

	it("lista una categoria por cada una del catalogo (RNF-08 CA3)", () => {
		renderConProviders(<Aside />);

		const enlaces = screen.getByRole("navigation", { name: "Categorias del catalogo" }).querySelectorAll("a");
		expect([...enlaces].map((a) => a.textContent)).toEqual(categorias().map((c) => c.nombre));
	});

	it("cada categoria lleva al listado filtrado (RF-14 CA3)", () => {
		renderConProviders(<Aside />);

		expect(screen.getByRole("link", { name: "Memoria RAM" })).toHaveAttribute("href", "/productos?categoria=ram");
	});

	it("marca la categoria activa segun la URL", () => {
		renderConProviders(<Aside />, { ruta: "/productos?categoria=gpu" });

		const activa = screen.getByRole("link", { name: "Tarjetas graficas" });
		expect(activa).toHaveClass("activa");
		expect(activa).toHaveAttribute("aria-current", "page");
		expect(screen.getByRole("link", { name: "Memoria RAM" })).not.toHaveAttribute("aria-current");
	});

	it("sin categoria en la URL no marca ninguna", () => {
		renderConProviders(<Aside />, { ruta: "/productos" });

		expect(document.querySelector("[aria-current='page']")).toBeNull();
	});

	it("incluye una categoria nueva sin tocar el componente", () => {
		window.sessionStorage.setItem("categorias", JSON.stringify([...categorias(), { codigo: "sillas", nombre: "Sillas gamer", orden: null }]));
		renderConProviders(<Aside />);

		expect(screen.getByRole("link", { name: "Sillas gamer" })).toHaveAttribute("href", "/productos?categoria=sillas");
	});

	it("invita al asistente de armado", () => {
		renderConProviders(<Aside />);

		expect(screen.getByRole("heading", { name: "Armado guiado" })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Armar mi PC" })).toHaveAttribute("href", "/armado");
	});
});
