import { screen, within } from "@testing-library/react";
import { renderConProviders } from "../../testUtils.jsx";
import Footer from "./Footer.jsx";

describe("Footer", () => {
	afterEach(() => vi.useRealTimers());

	it("muestra el nombre de la tienda y los datos de contacto (RNF-08 CA4)", () => {
		renderConProviders(<Footer />);

		expect(screen.getByRole("heading", { level: 2, name: "Ensambla.me" })).toBeInTheDocument();
		expect(screen.getByText(/Av\. Vicuna Mackenna 4860/)).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "contacto@ensambla.me" })).toHaveAttribute("href", "mailto:contacto@ensambla.me");
	});

	it("incluye los enlaces de navegacion principales", () => {
		renderConProviders(<Footer />);

		const tienda = screen.getByRole("navigation", { name: "Enlaces de la tienda" });
		expect(within(tienda).getByRole("link", { name: "Productos" })).toHaveAttribute("href", "/productos");
		expect(within(tienda).getByRole("link", { name: "Carrito" })).toHaveAttribute("href", "/carrito");
		const empresa = screen.getByRole("navigation", { name: "Enlaces de la empresa" });
		expect(within(empresa).getByRole("link", { name: "Nosotros" })).toHaveAttribute("href", "/nosotros");
		expect(within(empresa).getByRole("link", { name: "Contacto" })).toHaveAttribute("href", "/contacto");
	});

	it("muestra el ano en curso", () => {
		vi.useFakeTimers({ toFake: ["Date"] });
		vi.setSystemTime(new Date("2031-05-10T12:00:00"));
		renderConProviders(<Footer />);

		expect(screen.getByText(/© 2031 Ensambla\.me/)).toBeInTheDocument();
	});

	it("enlaza los creditos de las imagenes", () => {
		renderConProviders(<Footer />);

		expect(screen.getByRole("link", { name: "ver creditos" })).toHaveAttribute("href", "/creditos");
	});
});
