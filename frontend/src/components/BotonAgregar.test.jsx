import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { limpiarAlmacenamiento, renderConProviders } from "../testUtils.jsx";
import BotonAgregar from "./BotonAgregar.jsx";

const mouse = { sku: "PER-MOUSE-RGB", stock: 30 };

describe("BotonAgregar", () => {
	beforeEach(limpiarAlmacenamiento);

	it("con stock muestra el boton para anadir", () => {
		renderConProviders(<BotonAgregar producto={mouse} className="btn" />);

		const boton = screen.getByRole("button", { name: "Anadir al carrito" });
		expect(boton).toBeEnabled();
		expect(boton).toHaveClass("btn");
	});

	it("acepta otro texto", () => {
		renderConProviders(<BotonAgregar producto={mouse} texto="Comprar" />);

		expect(screen.getByRole("button", { name: "Comprar" })).toBeInTheDocument();
	});

	it("sin stock muestra el boton deshabilitado con el texto Sin stock", () => {
		renderConProviders(<BotonAgregar producto={{ sku: "X", stock: 0 }} />);

		expect(screen.getByRole("button", { name: "Sin stock" })).toBeDisabled();
		expect(screen.queryByRole("button", { name: "Anadir al carrito" })).not.toBeInTheDocument();
	});

	it("al hacer clic agrega el producto al carrito y lo confirma", async () => {
		renderConProviders(<BotonAgregar producto={mouse} />);

		await userEvent.click(screen.getByRole("button", { name: "Anadir al carrito" }));

		const guardado = JSON.parse(window.localStorage.getItem("carrito"));
		expect(guardado).toEqual([{ linea: 1, producto: "PER-MOUSE-RGB", cantidad: 1, armado: null }]);
		expect(screen.getByText(/se agrego al carrito/)).toBeInTheDocument();
	});

	it("cada clic suma una unidad a la misma linea", async () => {
		renderConProviders(<BotonAgregar producto={mouse} />);
		const boton = screen.getByRole("button", { name: "Anadir al carrito" });

		await userEvent.click(boton);
		await userEvent.click(boton);

		expect(JSON.parse(window.localStorage.getItem("carrito"))[0].cantidad).toBe(2);
	});
});
