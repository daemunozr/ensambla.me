import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import { limpiarAlmacenamiento, renderConProviders } from "../testUtils.jsx";
import Login from "./Login.jsx";

function montar(ruta = "/login") {
	return renderConProviders(
		<Routes>
			<Route path="/login" element={<Login />} />
			<Route path="/" element={<p>Pagina de inicio</p>} />
			<Route path="/admin" element={<p>Panel de administracion</p>} />
			<Route path="/admin/productos" element={<p>Productos del panel</p>} />
			<Route path="/carrito" element={<p>Pagina del carrito</p>} />
		</Routes>,
		{ ruta },
	);
}

async function entrar(correo, contrasena) {
	if (correo) await userEvent.type(screen.getByLabelText(/^Correo/), correo);
	if (contrasena) await userEvent.type(screen.getByLabelText(/^Contrasena/), contrasena);
	await userEvent.click(screen.getByRole("button", { name: "Entrar" }));
}

describe("Login", () => {
	beforeEach(limpiarAlmacenamiento);

	it("muestra el formulario y cambia el titulo de la pestana", () => {
		montar();

		expect(screen.getByRole("heading", { level: 1, name: "Iniciar sesion" })).toBeInTheDocument();
		expect(screen.getByLabelText(/^Correo/)).toBeRequired();
		expect(screen.getByLabelText(/^Contrasena/)).toHaveAttribute("type", "password");
		expect(document.title).toBe("Iniciar sesion — Ensambla.me");
	});

	it("enviar vacio muestra los errores de ambos campos y no inicia sesion", async () => {
		montar();

		await entrar();

		expect(screen.getAllByText("Este campo es obligatorio.")).toHaveLength(2);
		expect(screen.getByRole("heading", { level: 1, name: "Iniciar sesion" })).toBeInTheDocument();
		expect(window.sessionStorage.getItem("sesion")).toBeNull();
	});

	it("valida el correo mientras se escribe", async () => {
		montar();

		await userEvent.type(screen.getByLabelText(/^Correo/), "ana@hotmail.com");

		expect(screen.getByText(/Solo se aceptan los dominios/)).toBeInTheDocument();
		expect(screen.getByLabelText(/^Correo/)).toHaveClass("is-invalid");
	});

	it("unas credenciales incorrectas muestran un aviso generico", async () => {
		montar();

		await entrar("admin@duoc.cl", "mala1234");

		expect(screen.getByRole("alert")).toHaveTextContent("Correo o contrasena incorrectos.");
		expect(window.sessionStorage.getItem("sesion")).toBeNull();
	});

	it("el administrador entra al panel y queda con sesion", async () => {
		montar();

		await entrar("admin@duoc.cl", "admin1234");

		expect(screen.getByText("Panel de administracion")).toBeInTheDocument();
		expect(JSON.parse(window.sessionStorage.getItem("sesion"))).toMatchObject({ correo: "admin@duoc.cl", rol: "ADMIN" });
	});

	it("el administrador logistico entra a los productos", async () => {
		montar();

		await entrar("bodega@duoc.cl", "bodega123");

		expect(screen.getByText("Productos del panel")).toBeInTheDocument();
	});

	it("el cliente vuelve al inicio de la tienda", async () => {
		montar();

		await entrar("camila@gmail.com", "cliente123");

		expect(screen.getByText("Pagina de inicio")).toBeInTheDocument();
	});

	it("no distingue mayusculas ni espacios en el correo", async () => {
		montar();

		await entrar("  CAMILA@Gmail.com ", "cliente123");

		expect(screen.getByText("Pagina de inicio")).toBeInTheDocument();
	});

	it("vuelve a la vista que se pidio antes de iniciar sesion", async () => {
		montar("/login?destino=%2Fcarrito");

		await entrar("camila@gmail.com", "cliente123");

		expect(screen.getByText("Pagina del carrito")).toBeInTheDocument();
	});

	it("ignora un destino que apunta a otro sitio", async () => {
		montar("/login?destino=%2F%2Fmalo.com");

		await entrar("camila@gmail.com", "cliente123");

		expect(screen.getByText("Pagina de inicio")).toBeInTheDocument();
	});

	it("ofrece crear una cuenta", () => {
		montar();

		expect(screen.getByRole("link", { name: "Crear una cuenta" })).toHaveAttribute("href", "/registro");
	});
});
