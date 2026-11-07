import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ZonaAviso } from "../../components/Alerta.jsx";
import Campo from "../../components/Campo.jsx";
import CampoCorreo from "../../components/CampoCorreo.jsx";
import SelectRegionComuna from "../../components/SelectRegionComuna.jsx";
import { useDatos } from "../../context/datos.js";
import { comuna, roles, usuario as buscarUsuario } from "../../data/datos.js";
import { useFormulario } from "../../hooks/useFormulario.js";
import { useTitulo } from "../../hooks/useTitulo.js";
import { reglas } from "../../utils/validaciones.js";

const VACIO = {
	run: "",
	nombre: "",
	apellidos: "",
	correo: "",
	contrasena: "",
	tipoUsuario: "",
	fechaNacimiento: "",
	region: "",
	comuna: "",
	direccion: "",
};

// Mismas reglas que el registro publico (RF-01) mas el tipo de usuario (RF-11 CA2).
const DEFINICION = {
	run: [reglas.requerido(), reglas.run()],
	nombre: [reglas.requerido(), reglas.maximo(50)],
	apellidos: [reglas.requerido(), reglas.maximo(100)],
	correo: [reglas.requerido(), reglas.maximo(100), reglas.correo()],
	contrasena: [reglas.requerido(), reglas.contrasena()],
	tipoUsuario: [reglas.seleccion("Selecciona el tipo de usuario.")],
	region: [reglas.seleccion("Selecciona la region.")],
	comuna: [reglas.seleccion("Selecciona la comuna.")],
	direccion: [reglas.requerido(), reglas.maximo(300)],
};

/** Valores del formulario a partir de un usuario existente; la region sale de su comuna. */
const valoresDe = (existente) => ({
	...VACIO,
	...existente,
	fechaNacimiento: existente.fechaNacimiento ?? "",
	region: comuna(existente.comuna)?.region ?? "",
});

function Formulario({ run }) {
	const navegar = useNavigate();
	const { crearUsuario, actualizarUsuario } = useDatos();
	const existente = run ? buscarUsuario(run) : null;
	const formulario = useFormulario(existente ? valoresDe(existente) : VACIO, DEFINICION);
	const { registrar, estado, errores, enviar } = formulario;
	const [aviso, setAviso] = useState(
		run && !existente ? { tipo: "danger", contenido: `No existe un usuario con RUN ${run}.` } : null,
	);
	useTitulo(existente ? "Editar usuario — Panel Ensambla.me" : "Ficha de usuario — Panel Ensambla.me");

	const alEnviar = (datos) => {
		const registro = {
			run: datos.run,
			nombre: datos.nombre,
			apellidos: datos.apellidos,
			correo: datos.correo,
			contrasena: datos.contrasena,
			fechaNacimiento: datos.fechaNacimiento || "",
			comuna: datos.comuna,
			direccion: datos.direccion,
			tipoUsuario: datos.tipoUsuario,
		};

		// La capa de datos rechaza un RUN repetido y un correo usado por otro usuario.
		const resultado = existente ? actualizarUsuario(existente.run, registro) : crearUsuario(registro);
		if (!resultado.ok) {
			setAviso({ tipo: "danger", contenido: resultado.mensaje });
			return;
		}
		navegar(`/admin/usuarios?guardado=${encodeURIComponent(resultado.registro.run)}`);
	};

	const props = (nombre) => ({ error: errores[nombre], estado: estado(nombre), ...registrar(nombre) });

	return (
		<main className="col-12 col-lg-9">
			<p className="sobretitulo">Mantenedor de usuarios</p>
			<h1 className="h3">{existente ? `Editar ${existente.nombre} ${existente.apellidos}` : "Nuevo usuario"}</h1>
			<p className="text-secondary mb-4">
				Mismas reglas que el registro publico, mas el tipo de usuario, que solo se asigna aqui.
			</p>

			<section className="tarjeta-formulario p-4">
				<ZonaAviso aviso={aviso} />

				<form noValidate onSubmit={enviar(alEnviar)}>
					<div className="row g-3">
						<Campo
							className="col-12 col-md-4"
							id="usuario-run"
							etiqueta="RUN"
							obligatorio
							maxLength={9}
							autoComplete="off"
							readOnly={Boolean(existente)}
							sugerencia="Sin puntos ni guion, con digito verificador. Ejemplo: 190110222."
							{...props("run")}
						/>
						<Campo
							className="col-12 col-md-4"
							id="usuario-nombre"
							etiqueta="Nombre"
							obligatorio
							maxLength={50}
							autoComplete="given-name"
							sugerencia="Hasta 50 caracteres."
							{...props("nombre")}
						/>
						<Campo
							className="col-12 col-md-4"
							id="usuario-apellidos"
							etiqueta="Apellidos"
							obligatorio
							maxLength={100}
							autoComplete="family-name"
							sugerencia="Hasta 100 caracteres."
							{...props("apellidos")}
						/>
						<CampoCorreo
							className="col-12 col-md-6"
							id="usuario-correo"
							etiqueta="Correo"
							obligatorio
							autoComplete="email"
							sugerencia="Dominios aceptados: @duoc.cl, @profesor.duoc.cl y @gmail.com."
							{...props("correo")}
						/>
						<Campo
							className="col-12 col-md-6"
							id="usuario-contrasena"
							etiqueta="Contrasena"
							obligatorio
							type="password"
							maxLength={10}
							autoComplete="new-password"
							sugerencia="Entre 4 y 10 caracteres."
							{...props("contrasena")}
						/>
						{/* Exactamente los tres roles; este campo no existe en el registro publico (RF-11 CA3). */}
						<Campo
							como="select"
							className="col-12 col-md-4"
							id="usuario-tipo"
							etiqueta="Tipo de usuario"
							obligatorio
							autoComplete="off"
							sugerencia="Determina a que secciones accede al iniciar sesion."
							{...props("tipoUsuario")}
						>
							<option value="">Selecciona un tipo</option>
							{roles.map((rol) => (
								<option key={rol.codigo} value={rol.codigo}>
									{rol.nombre}
								</option>
							))}
						</Campo>
						<Campo
							className="col-12 col-md-4"
							id="usuario-nacimiento"
							etiqueta="Fecha de nacimiento"
							type="date"
							autoComplete="bday"
							sugerencia="Campo opcional."
							{...registrar("fechaNacimiento")}
						/>
						<SelectRegionComuna formulario={formulario} prefijo="usuario" />
						<Campo
							className="col-12 col-md-8"
							id="usuario-direccion"
							etiqueta="Direccion"
							obligatorio
							maxLength={300}
							autoComplete="address-line1"
							sugerencia="Hasta 300 caracteres."
							{...props("direccion")}
						/>
					</div>

					<div className="d-flex flex-wrap gap-2 mt-4">
						<button type="submit" className="btn btn-primary">
							Guardar usuario
						</button>
						<Link className="btn btn-outline-primary" to="/admin/usuarios">
							Volver al listado
						</Link>
					</div>
				</form>
			</section>
		</main>
	);
}

/** Creacion (/admin/usuarios/nuevo) y edicion (/admin/usuarios/:run/editar) de usuarios (RF-11). */
export default function FormularioUsuario() {
	const { run = "" } = useParams();
	return <Formulario key={run} run={run} />;
}
