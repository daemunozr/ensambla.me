import { screen } from "@testing-library/react";
import { SESION_ADMIN, SESION_CLIENTE, SESION_LOGISTICA, limpiarAlmacenamiento, renderConProviders } from "../../testUtils.jsx";
import AsideAdmin from "./AsideAdmin.jsx";

const montar = (sesion, ruta = "/admin") => renderConProviders(<AsideAdmin />, { sesion, ruta });
const opciones = () => screen.getByRole("navigation").querySelectorAll("a");
const textos = () => [...opciones()].map((a) => a.textContent);

describe("AsideAdmin", () => {
	beforeEach(limpiarAlmacenamiento);

	it("el administrador ve todas las opciones del panel", () => {
		montar(SESION_ADMIN);

		expect(textos()).toEqual(["Resumen", "Productos", "Criticos", "Categorias", "Usuarios", "Ordenes", "Reportes", "Mi perfil"]);
	});

	it("el logistico solo tiene Productos, Criticos, Ordenes y Mi perfil, y las demas no existen en el DOM (RNF-02 CA2)", () => {
		montar(SESION_LOGISTICA, "/admin/productos");

		expect(textos()).toEqual(["Productos", "Criticos", "Ordenes", "Mi perfil"]);
		["Resumen", "Categorias", "Usuarios", "Reportes"].forEach((texto) =>
			expect(screen.queryByRole("link", { name: texto })).not.toBeInTheDocument(),
		);
	});

	it("un cliente o sin sesion no ve ninguna opcion", () => {
		const { unmount } = montar(SESION_CLIENTE);
		expect(opciones()).toHaveLength(0);
		unmount();

		montar(null);
		expect(opciones()).toHaveLength(0);
	});

	it("marca la opcion de la vista actual", () => {
		montar(SESION_ADMIN, "/admin/usuarios");

		const activa = screen.getByRole("link", { name: "Usuarios" });
		expect(activa).toHaveClass("activo");
		expect(activa).toHaveAttribute("aria-current", "page");
		expect(screen.getByRole("link", { name: "Productos" })).not.toHaveClass("activo");
	});

	it("una subruta marca su opcion (edicion de un producto -> Productos)", () => {
		montar(SESION_ADMIN, "/admin/productos/CPU-R5-7600/editar");

		expect(screen.getByRole("link", { name: "Productos" })).toHaveClass("activo");
	});

	it("Resumen solo se marca en la ruta exacta", () => {
		montar(SESION_ADMIN, "/admin/ordenes");

		expect(screen.getByRole("link", { name: "Resumen" })).not.toHaveClass("activo");
		expect(screen.getByRole("link", { name: "Ordenes" })).toHaveClass("activo");
	});

	it("en Criticos no se marca tambien Productos", () => {
		montar(SESION_ADMIN, "/admin/productos/criticos");

		expect(screen.getByRole("link", { name: "Criticos" })).toHaveClass("activo");
		expect(screen.getByRole("link", { name: "Productos" })).not.toHaveClass("activo");
	});

	it("ofrece volver a la tienda", () => {
		montar(SESION_ADMIN);

		expect(screen.getByRole("link", { name: "Volver a la tienda" })).toHaveAttribute("href", "/");
	});
});
