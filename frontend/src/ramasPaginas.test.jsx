/*
 * Ramas de las vistas que dependen de datos poco comunes: rutas sin parametro,
 * registros incompletos, listas de un solo elemento y compras que el servidor
 * rechaza.
 */
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import { guardarCarrito } from "./context/carrito.js";
import { ordenes, producto, productos, usuario, usuarios } from "./data/datos.js";
import { SESION_ADMIN, SESION_CLIENTE, limpiarAlmacenamiento, renderConProviders, sesionDe } from "./testUtils.jsx";
import Armado from "./pages/Armado.jsx";
import Blog from "./pages/Blog.jsx";
import Carrito from "./pages/Carrito.jsx";
import Checkout from "./pages/Checkout.jsx";
import MiCompra from "./pages/MiCompra.jsx";
import Ofertas from "./pages/Ofertas.jsx";
import PagoCorrecto from "./pages/PagoCorrecto.jsx";
import Perfil from "./pages/Perfil.jsx";
import Producto from "./pages/Producto.jsx";
import Orden from "./pages/admin/Orden.jsx";
import OrdenesAdmin from "./pages/admin/Ordenes.jsx";
import ProductosAdmin from "./pages/admin/Productos.jsx";
import FormularioProducto from "./pages/admin/FormularioProducto.jsx";
import FormularioUsuario from "./pages/admin/FormularioUsuario.jsx";
import Usuario from "./pages/admin/Usuario.jsx";

const CAMILA = "123456785";

const guardar = (clave, lista) => window.sessionStorage.setItem(clave, JSON.stringify(lista));
const conCambios = (lista, clave, valor, cambios) => lista.map((registro) => (registro[clave] === valor ? { ...registro, ...cambios } : registro));
const sinCampos = (registro, ...campos) => Object.fromEntries(Object.entries(registro).filter(([campo]) => !campos.includes(campo)));

beforeEach(limpiarAlmacenamiento);

describe("vistas de detalle sin parametro en la ruta", () => {
	it.each([
		["Blog", <Blog />, "(sin identificador)"],
		["Producto", <Producto />, "(sin codigo)"],
		["MiCompra", <MiCompra />, "(sin numero)"],
		["PagoCorrecto", <PagoCorrecto />, "(sin numero)"],
		["admin / Orden", <Orden />, "(sin numero)"],
		["admin / Usuario", <Usuario />, "(sin RUN)"],
	])("%s avisa que no hay identificador", (_nombre, vista, texto) => {
		renderConProviders(vista);

		expect(screen.getByText(texto)).toBeInTheDocument();
	});
});

describe("Armado", () => {
	it("si la categoria siguiente no tiene productos lo avisa", async () => {
		guardar("productos", productos().filter((p) => p.categoria !== "placa"));
		renderConProviders(<Armado />);

		await userEvent.click(screen.getByRole("button", { name: "Armar equipo completo" }));
		await userEvent.click(screen.getAllByRole("radio").find((radio) => !radio.disabled));
		await userEvent.click(screen.getByRole("button", { name: "Continuar" }));

		expect(screen.getByText(/No hay componentes de esta categoria compatibles/)).toBeInTheDocument();
	});
});

describe("Carrito con un armado de un solo componente", () => {
	it("escribe «componente» en singular", () => {
		guardarCarrito([{ linea: 1, producto: "PER-MOUSE-RGB", cantidad: 1, armado: "ARM-1" }]);

		renderConProviders(<Carrito />);

		expect(screen.getByText(/Conjunto ARM-1/)).toHaveTextContent("1 componente");
		expect(screen.getByText(/Conjunto ARM-1/)).not.toHaveTextContent("1 componentes");
	});
});

describe("Ofertas con un solo producto", () => {
	it("escribe «producto» en singular", () => {
		guardar("productos", productos().map((p) => ({ ...p, descuento: p.sku === "CPU-R5-7600" ? 10 : "" })));

		renderConProviders(
			<Routes>
				<Route path="/ofertas" element={<Ofertas />} />
			</Routes>,
			{ ruta: "/ofertas" },
		);

		expect(screen.getByText("1 de 1 producto en oferta.")).toBeInTheDocument();
	});
});

describe("Checkout", () => {
	const montar = (sesion = null, ruta = "/checkout") =>
		renderConProviders(
			<Routes>
				<Route path="/checkout" element={<Checkout />} />
				<Route path="/pago/*" element={<p>Pagina de pago</p>} />
			</Routes>,
			{ ruta, sesion },
		);

	const escribir = async (etiqueta, texto) => userEvent.type(screen.getByLabelText(etiqueta), texto);

	async function llenarEnvio() {
		await escribir(/^Nombre/, "Luisa");
		await escribir(/^Apellidos/, "Pino Rojas");
		await escribir(/^Correo/, "luisa@gmail.com");
		await userEvent.selectOptions(screen.getByLabelText(/Region/), "RM");
		await userEvent.selectOptions(screen.getByLabelText(/Comuna/), "RM-04");
		await escribir(/^Direccion/, "Calle 123");
	}

	it("retoma los datos de envio de un intento anterior", () => {
		guardarCarrito([{ linea: 1, producto: "PER-MOUSE-RGB", cantidad: 1, armado: null }]);

		montar(null, {
			pathname: "/checkout",
			state: {
				datos: { nombre: "Luisa", apellidos: "Pino", correo: "luisa@gmail.com", region: "RM", comuna: "RM-04", direccion: "Calle 1", entrega: "RETIRO" },
			},
		});

		expect(screen.getByLabelText(/^Nombre/)).toHaveValue("Luisa");
		expect(screen.getByLabelText(/Retiro en tienda/)).toBeChecked();
	});

	it("una cuenta con una comuna que ya no existe parte sin region", () => {
		guardarCarrito([{ linea: 1, producto: "PER-MOUSE-RGB", cantidad: 1, armado: null }]);
		const sesion = sesionDe(usuario(CAMILA));
		guardar("usuarios", conCambios(usuarios(), "run", CAMILA, { comuna: "XX-99" }));

		montar(sesion);

		expect(screen.getByLabelText(/Region/)).toHaveValue("");
	});

	it("un invitado confirma un pedido sin costo y la orden queda sin cliente ni pago", async () => {
		guardarCarrito([{ linea: 1, producto: "PER-MOUSEPAD", cantidad: 1, armado: null }]);
		montar();

		await llenarEnvio();
		await userEvent.click(screen.getByLabelText(/Retiro en tienda/));
		await userEvent.click(screen.getByRole("button", { name: "Confirmar pedido" }));

		expect(screen.getByText("Pagina de pago")).toBeInTheDocument();
		expect(ordenes().at(-1)).toMatchObject({ cliente: "", medioPago: "Sin pago", entrega: "RETIRO" });
	});

	it("si la orden no se puede registrar muestra el motivo y no sale de la pagina", async () => {
		guardarCarrito([{ linea: 1, producto: "PER-MOUSEPAD", cantidad: 1, armado: null }]);
		montar(SESION_CLIENTE);

		await llenarEnvio();
		await userEvent.click(screen.getByLabelText(/Retiro en tienda/));
		await userEvent.click(screen.getByRole("button", { name: "Confirmar pedido" }));

		expect(screen.getByText("La cuenta con la que compras ya no existe.")).toBeInTheDocument();
		expect(screen.queryByText("Pagina de pago")).not.toBeInTheDocument();
	});
});

describe("Perfil con una cuenta incompleta", () => {
	it("sin fecha de nacimiento se guarda igual con la fecha vacia", async () => {
		const sesion = sesionDe(usuario(CAMILA));
		guardar("usuarios", usuarios().map((u) => (u.run === CAMILA ? sinCampos(u, "fechaNacimiento") : u)));
		renderConProviders(<Perfil />, { sesion });

		await userEvent.click(screen.getByRole("button", { name: "Guardar mis datos" }));

		expect(screen.getByText("Tus datos se guardaron correctamente.")).toBeInTheDocument();
		expect(usuario(CAMILA).fechaNacimiento).toBe("");
	});

	it("una comuna que ya no existe deja la region sin escoger", () => {
		const sesion = sesionDe(usuario(CAMILA));
		guardar("usuarios", conCambios(usuarios(), "run", CAMILA, { comuna: "XX-99" }));

		renderConProviders(<Perfil />, { sesion });

		expect(screen.getByLabelText(/Region/)).toHaveValue("");
	});

	it("si la cuenta no se puede actualizar al cambiar la contrasena, muestra el motivo", async () => {
		const sesion = sesionDe(usuario(CAMILA));
		guardar("usuarios", conCambios(usuarios(), "run", CAMILA, { correo: "admin@duoc.cl" }));
		renderConProviders(<Perfil />, { sesion });

		await userEvent.type(screen.getByLabelText(/^Contrasena actual/), "cliente123");
		await userEvent.type(screen.getByLabelText(/^Contrasena nueva/), "nueva1234");
		await userEvent.type(screen.getByLabelText(/^Repite la contrasena nueva/), "nueva1234");
		await userEvent.click(screen.getByRole("button", { name: "Cambiar contrasena" }));

		expect(screen.getByText("El correo admin@duoc.cl ya esta usado por otro usuario.")).toBeInTheDocument();
	});
});

describe("panel de administracion con registros incompletos", () => {
	const enPanel = (vista, ruta, patron) =>
		renderConProviders(
			<Routes>
				<Route path={patron ?? ruta} element={vista} />
			</Routes>,
			{ ruta, sesion: SESION_ADMIN },
		);

	it("una orden con un producto que ya no existe se puede buscar y listar", () => {
		guardar("itemsOrden", [{ orden: "ORD-2026-0001", producto: "SKU-FANTASMA", cantidad: 1, precioUnitario: 100 }]);

		enPanel(<OrdenesAdmin />, "/admin/ordenes");

		expect(screen.getAllByText(/SKU-FANTASMA/).length).toBeGreaterThan(0);
	});

	it("un producto sin stock critico muestra un guion", () => {
		guardar("productos", productos().map((p) => ({ ...p, stockCritico: "" })));

		enPanel(<ProductosAdmin />, "/admin/productos");

		expect(screen.getAllByText("—").length).toBeGreaterThan(0);
	});

	it("sin productos cargados lo dice", () => {
		guardar("productos", []);

		enPanel(<ProductosAdmin />, "/admin/productos");

		expect(screen.getByText("No hay productos cargados.")).toBeInTheDocument();
	});

	it("un usuario con una sola compra la cuenta en singular", () => {
		const suyas = ordenes().filter((o) => o.cliente === CAMILA);
		guardar("ordenes", [...ordenes().filter((o) => o.cliente !== CAMILA), suyas[0]]);

		enPanel(<Usuario />, `/admin/usuarios/${CAMILA}`, "/admin/usuarios/:run");

		expect(screen.getByText(/^1 compra por un total de/)).toBeInTheDocument();
	});

	it("editar un producto al que le faltan campos los deja vacios", () => {
		guardar("productos", productos().map((p) => (p.sku === "CPU-R5-7600" ? sinCampos(p, "video", "descuento") : p)));

		enPanel(<FormularioProducto />, "/admin/productos/CPU-R5-7600/editar", "/admin/productos/:sku/editar");

		expect(screen.getByLabelText(/^Video/)).toHaveValue("");
		expect(producto("CPU-R5-7600").video).toBeUndefined();
	});

	it("editar un usuario sin fecha de nacimiento ni comuna conocida deja ambos vacios", () => {
		guardar("usuarios", usuarios().map((u) => (u.run === CAMILA ? { ...sinCampos(u, "fechaNacimiento"), comuna: "XX-99" } : u)));

		enPanel(<FormularioUsuario />, `/admin/usuarios/${CAMILA}/editar`, "/admin/usuarios/:run/editar");

		expect(screen.getByLabelText(/^Fecha de nacimiento/)).toHaveValue("");
		expect(screen.getByLabelText(/Region/)).toHaveValue("");
	});
});
