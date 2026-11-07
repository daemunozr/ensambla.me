import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { ZonaAviso } from "../components/Alerta.jsx";
import Campo from "../components/Campo.jsx";
import CampoCorreo from "../components/CampoCorreo.jsx";
import { destinoSeguro, inicioDeRol, useSesion } from "../context/sesion.js";
import { useFormulario } from "../hooks/useFormulario.js";
import { useTitulo } from "../hooks/useTitulo.js";
import { reglas } from "../utils/validaciones.js";

const INICIAL = { correo: "", contrasena: "" };

const DEFINICION = {
	correo: [reglas.requerido(), reglas.maximo(100), reglas.correo()],
	contrasena: [reglas.requerido(), reglas.contrasena()],
};

/** Inicio de sesion con redireccion segun el rol (RF-02). */
export default function Login() {
	useTitulo("Iniciar sesion — Ensambla.me");
	const { iniciar } = useSesion();
	const navegar = useNavigate();
	const [parametros] = useSearchParams();
	const { registrar, estado, errores, enviar } = useFormulario(INICIAL, DEFINICION);
	const [aviso, setAviso] = useState(null);

	const alEnviar = (datos) => {
		const resultado = iniciar(datos.correo, datos.contrasena);
		if (!resultado.ok) {
			setAviso({ tipo: "danger", contenido: resultado.mensaje });
			return;
		}
		// Vuelve a la vista protegida que se pidio, o al inicio del rol (RF-02 CA1).
		navegar(destinoSeguro(parametros.get("destino")) ?? inicioDeRol(resultado.sesion.rol));
	};

	return (
		<main>
			<p className="sobretitulo">Acceso</p>
			<h1 className="h3">Iniciar sesion</h1>
			<p className="text-secondary mb-4">
				Cada rol llega a lo que le corresponde: la tienda, el panel de administracion o la consulta de productos y
				ordenes.
			</p>

			<div className="row g-4">
				<div className="col-12 col-lg-6">
					<section className="tarjeta-formulario p-4">
						<h2 className="h5 mb-3">Tus credenciales</h2>
						<ZonaAviso aviso={aviso} />

						<form noValidate onSubmit={enviar(alEnviar)}>
							<CampoCorreo
								className="mb-3"
								id="login-correo"
								etiqueta="Correo"
								obligatorio
								autoComplete="username"
								sugerencia="Dominios aceptados: @duoc.cl, @profesor.duoc.cl y @gmail.com."
								error={errores.correo}
								estado={estado("correo")}
								{...registrar("correo")}
							/>
							<Campo
								className="mb-3"
								id="login-contrasena"
								etiqueta="Contrasena"
								obligatorio
								type="password"
								maxLength={10}
								autoComplete="current-password"
								sugerencia="Entre 4 y 10 caracteres."
								error={errores.contrasena}
								estado={estado("contrasena")}
								{...registrar("contrasena")}
							/>

							<div className="d-flex flex-wrap gap-2">
								<button type="submit" className="btn btn-primary">
									Entrar
								</button>
								<Link className="btn btn-outline-primary" to="/registro">
									Crear una cuenta
								</Link>
							</div>
						</form>
					</section>
				</div>

				<div className="col-12 col-lg-6">
					<section className="card">
						<div className="card-body">
							<h2 className="h6 card-title">Cuentas de prueba</h2>
							<p className="small text-secondary">
								Los datos de esta entrega se simulan en arreglos JavaScript. Estas cuentas vienen cargadas para
								revisar cada rol:
							</p>
							<dl className="row small mb-0">
								<dt className="col-5">Administrador</dt>
								<dd className="col-7">admin@duoc.cl / admin1234</dd>
								<dt className="col-5">Admin. logistico</dt>
								<dd className="col-7">bodega@duoc.cl / bodega123</dd>
								<dt className="col-5">Cliente</dt>
								<dd className="col-7">camila@gmail.com / cliente123</dd>
							</dl>
						</div>
					</section>
				</div>
			</div>
		</main>
	);
}
