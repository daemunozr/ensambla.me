import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes, useLocation } from "react-router";
import { categorias, producto, productos } from "../../data/datos.js";
import { SESION_ADMIN, limpiarAlmacenamiento, renderConProviders } from "../../testUtils.jsx";
import FormularioProducto from "./FormularioProducto.jsx";

function Ubicacion() {
	const { pathname, search } = useLocation();
	return <p data-testid="ubicacion">{pathname + search}</p>;
}

function montar(ruta = "/admin/productos/nuevo") {
	return renderConProviders(
		<>
			<Routes>
				<Route path="/admin/productos/nuevo" element={<FormularioProducto />} />
				<Route path="/admin/productos/:sku/editar" element={<FormularioProducto />} />
				<Route path="/admin/productos" element={<p>Listado</p>} />
			</Routes>
			<Ubicacion />
		</>,
		{ ruta, sesion: SESION_ADMIN },
	);
}

// "Precio" y "Stock" no deben confundirse con "Precio final" ni con "Stock critico".
const campo = (etiqueta) => screen.getByLabelText(new RegExp(`^${etiqueta}(?! final| critico)`));
const guardar = () => userEvent.click(screen.getByRole("button", { name: "Guardar producto" }));
const escribir = async (etiqueta, valor) => {
	const control = campo(etiqueta);
	await userEvent.clear(control);
	if (valor !== "") await userEvent.type(control, valor);
};

async function llenarValido(cambios = {}) {
	const v = { sku: "NUEVO-001", nombre: "Producto de prueba", precio: "10000", stock: "5", ...cambios };
	await escribir("Codigo de producto", v.sku);
	await escribir("Nombre", v.nombre);
	await escribir("Precio", v.precio);
	await escribir("Stock", v.stock);
	await userEvent.selectOptions(campo("Categoria"), "cpu");
}

describe("admin / FormularioProducto", () => {
	beforeEach(limpiarAlmacenamiento);

	describe("crear", () => {
		it("muestra el formulario vacio con sus campos obligatorios", () => {
			montar();

			expect(screen.getByRole("heading", { level: 1, name: "Nuevo producto" })).toBeInTheDocument();
			["Codigo de producto", "Nombre", "Precio", "Stock", "Categoria"].forEach((e) => expect(campo(e)).toBeRequired());
			["Descripcion", "Descuento", "Stock critico", "Imagen", "Video"].forEach((e) => expect(campo(e)).not.toBeRequired());
			expect(campo("Codigo de producto")).not.toHaveAttribute("readonly");
		});

		it("la categoria se escoge entre las del catalogo (RF-10 CA3)", () => {
			montar();

			const opciones = [...campo("Categoria").querySelectorAll("option")].map((o) => o.value);
			expect(opciones).toEqual(["", ...categorias().map((c) => c.codigo)]);
		});

		it("enviar vacio muestra un error por campo obligatorio y no crea el producto (RF-10 CA3)", async () => {
			montar();
			const antes = productos().length;

			await guardar();

			expect(screen.getAllByText("Este campo es obligatorio.").length).toBeGreaterThanOrEqual(4);
			expect(screen.getByText("Selecciona la categoria del producto.")).toBeInTheDocument();
			expect(productos()).toHaveLength(antes);
		});

		it("rechaza un codigo de menos de 3 caracteres (RF-10 CA2)", async () => {
			montar();

			await escribir("Codigo de producto", "AB");

			expect(screen.getByText("Debe tener al menos 3 caracteres.")).toBeInTheDocument();
		});

		it("rechaza un precio negativo y un stock negativo o con decimales (RF-10 CA2)", async () => {
			montar();

			await escribir("Precio", "-1");
			await escribir("Stock", "1.5");

			expect(campo("Precio")).toHaveClass("is-invalid");
			expect(screen.getByText("No puede ser menor que 0.")).toBeInTheDocument();
			expect(campo("Stock")).toHaveClass("is-invalid");
			expect(campo("Stock").closest("div").querySelector(".invalid-feedback")).toHaveTextContent(/entero/i);
			await escribir("Stock", "-3");
			expect(screen.getAllByText("No puede ser menor que 0.")).toHaveLength(2);
		});

		it("el precio admite decimales y el 0 se acepta como producto gratuito (RF-10 CA2)", async () => {
			montar();

			await escribir("Precio", "0");
			expect(screen.getByLabelText("Precio final")).toHaveTextContent("Gratis");

			await escribir("Precio", "1999.5");
			expect(campo("Precio")).not.toHaveClass("is-invalid");
		});

		it("el descuento debe ser un entero entre 0 y 90 (RF-10 CA2)", async () => {
			montar();

			await escribir("Descuento", "91");
			expect(screen.getByText("No puede ser mayor que 90.")).toBeInTheDocument();
			await escribir("Descuento", "10.5");
			expect(campo("Descuento")).toHaveClass("is-invalid");
			await escribir("Descuento", "-5");
			expect(campo("Descuento")).toHaveClass("is-invalid");
			await escribir("Descuento", "15");
			expect(campo("Descuento")).not.toHaveClass("is-invalid");
		});

		it("el precio final refleja el descuento (RF-18 CA2)", async () => {
			montar();

			expect(screen.getByLabelText("Precio final")).toHaveTextContent("—");
			await escribir("Precio", "10000");
			await escribir("Descuento", "10");

			expect(screen.getByLabelText("Precio final")).toHaveTextContent("$9.000");
		});

		it("con datos validos crea el producto y vuelve al listado con el aviso (RF-10 CA1)", async () => {
			montar();
			await llenarValido();
			await escribir("Descuento", "20");
			await escribir("Stock critico", "2");

			await guardar();

			expect(producto("NUEVO-001")).toMatchObject({
				nombre: "Producto de prueba",
				precio: 10000,
				descuento: 20,
				stock: 5,
				stockCritico: 2,
				categoria: "cpu",
			});
			expect(screen.getByTestId("ubicacion")).toHaveTextContent("/admin/productos?guardado=NUEVO-001");
		});

		it("el descuento y el stock critico vacios se guardan vacios (sin oferta ni alerta)", async () => {
			montar();
			await llenarValido();

			await guardar();

			expect(producto("NUEVO-001")).toMatchObject({ descuento: "", stockCritico: "" });
		});

		it("el video se conserva y dejarlo vacio no impide guardar (RF-10 CA5)", async () => {
			montar();
			await llenarValido();
			await escribir("Video", "resources/video/ensamblame.mp4");

			await guardar();

			expect(producto("NUEVO-001").video).toBe("resources/video/ensamblame.mp4");
		});

		it("un codigo que ya existe se rechaza y el formulario sigue abierto", async () => {
			montar();
			await llenarValido({ sku: "CPU-R5-7600" });

			await guardar();

			expect(screen.getByRole("alert")).toHaveTextContent("Ya existe un producto con el codigo CPU-R5-7600.");
			expect(screen.getByTestId("ubicacion")).toHaveTextContent("/admin/productos/nuevo");
			expect(producto("CPU-R5-7600").nombre).toBe("AMD Ryzen 5 7600");
		});

		it("una descripcion de mas de 500 caracteres no puede ingresarse", () => {
			montar();

			expect(campo("Descripcion")).toHaveAttribute("maxlength", "500");
			expect(campo("Nombre")).toHaveAttribute("maxlength", "100");
		});
	});

	describe("editar", () => {
		it("parte con los datos del producto y no deja cambiar su codigo", () => {
			montar("/admin/productos/CPU-R5-7600/editar");

			expect(screen.getByRole("heading", { level: 1, name: "Editar AMD Ryzen 5 7600" })).toBeInTheDocument();
			expect(campo("Codigo de producto")).toHaveValue("CPU-R5-7600");
			expect(campo("Codigo de producto")).toHaveAttribute("readonly");
			expect(campo("Precio")).toHaveValue(producto("CPU-R5-7600").precio);
			expect(campo("Categoria")).toHaveValue("cpu");
			expect(campo("Descuento")).toHaveValue(15);
		});

		it("guardar refleja los cambios en el producto (RF-10 CA1)", async () => {
			montar("/admin/productos/CPU-R5-7600/editar");

			await escribir("Stock", "99");
			await escribir("Descuento", "");
			await guardar();

			expect(producto("CPU-R5-7600")).toMatchObject({ stock: 99, descuento: "" });
			expect(screen.getByTestId("ubicacion")).toHaveTextContent("/admin/productos?guardado=CPU-R5-7600");
		});

		it("un codigo que no existe avisa al abrir", () => {
			montar("/admin/productos/NO-EXISTE/editar");

			expect(screen.getByRole("alert")).toHaveTextContent("No existe un producto con el codigo NO-EXISTE.");
		});
	});

	it("«Volver al listado» regresa sin guardar", async () => {
		montar();

		await userEvent.click(screen.getByRole("link", { name: "Volver al listado" }));

		expect(screen.getByTestId("ubicacion")).toHaveTextContent("/admin/productos");
	});
});
