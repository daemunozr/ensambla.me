import { useState } from "react";
import { ZonaAviso } from "../components/Alerta.jsx";
import Campo from "../components/Campo.jsx";
import CampoCorreo from "../components/CampoCorreo.jsx";
import EstadoVacio from "../components/EstadoVacio.jsx";
import SelectRegionComuna from "../components/SelectRegionComuna.jsx";
import { useDatos } from "../context/datos.js";
import { useSesion } from "../context/sesion.js";
import { comuna, nombreRol } from "../data/datos.js";
import { useFormulario } from "../hooks/useFormulario.js";
import { useTitulo } from "../hooks/useTitulo.js";
import { reglas } from "../utils/validaciones.js";

const DATOS = {
	nombre: [reglas.requerido(), reglas.maximo(50)],
	apellidos: [reglas.requerido(), reglas.maximo(100)],
	correo: [reglas.requerido(), reglas.maximo(100), reglas.correo()],
	region: [reglas.seleccion("Selecciona tu region.")],
	comuna: [reglas.seleccion("Selecciona tu comuna.")],
	direccion: [reglas.requerido(), reglas.maximo(300)],
};

const CONTRASENA = {
	actual: [reglas.requerido()],
	nueva: [reglas.requerido(), reglas.contrasena()],
	repetir: [reglas.requerido()],
};
const CONTRASENA_VACIA = { actual: "", nueva: "", repetir: "" };

/** Datos personales editables. RUN y tipo de usuario no se editan aqui: el rol solo lo asigna un administrador. */
function DatosPersonales({ cuenta }) {
	const { actualizarUsuario } = useDatos();
	const { actualizar } = useSesion();
	const inicial = {
		nombre: cuenta.nombre,
		apellidos: cuenta.apellidos,
		correo: cuenta.correo,
		fechaNacimiento: cuenta.fechaNacimiento ?? "",
		region: comuna(cuenta.comuna)?.region ?? "",
		comuna: cuenta.comuna,
		direccion: cuenta.direccion,
	};
	const formulario = useFormulario(inicial, DATOS);
	const { registrar, estado, errores, enviar } = formulario;
	const [aviso, setAviso] = useState(null);

	const alEnviar = (datos) => {
		// Se parte de la cuenta guardada: asi se conservan la contrasena y el tipo de usuario.
		const resultado = actualizarUsuario(cuenta.run, {
			...cuenta,
			nombre: datos.nombre,
			apellidos: datos.apellidos,
			correo: datos.correo,
			fechaNacimiento: datos.fechaNacimiento || "",
			comuna: datos.comuna,
			direccion: datos.direccion,
		});
		if (!resultado.ok) {
			setAviso({ tipo: "danger", contenido: resultado.mensaje });
			return;
		}
		actualizar({ nombre: datos.nombre, apellidos: datos.apellidos, correo: resultado.registro.correo });
		setAviso({ tipo: "success", contenido: "Tus datos se guardaron correctamente." });
	};

	const props = (nombre) => ({ error: errores[nombre], estado: estado(nombre), ...registrar(nombre) });

	return (
		<section className="tarjeta-formulario p-4" aria-labelledby="perfil-datos">
			<h2 className="h5 mb-3" id="perfil-datos">
				Tus datos
			</h2>
			<dl className="row small mb-3">
				<dt className="col-5 col-md-3">RUN</dt>
				<dd className="col-7 col-md-9">{cuenta.run}</dd>
				<dt className="col-5 col-md-3">Tipo de usuario</dt>
				<dd className="col-7 col-md-9">{nombreRol(cuenta.tipoUsuario)}</dd>
			</dl>

			<ZonaAviso aviso={aviso} />

			<form noValidate onSubmit={enviar(alEnviar)}>
				<div className="row g-3">
					<Campo
						className="col-12 col-md-6"
						id="perfil-nombre"
						etiqueta="Nombre"
						obligatorio
						maxLength={50}
						autoComplete="given-name"
						{...props("nombre")}
					/>
					<Campo
						className="col-12 col-md-6"
						id="perfil-apellidos"
						etiqueta="Apellidos"
						obligatorio
						maxLength={100}
						autoComplete="family-name"
						{...props("apellidos")}
					/>
					<CampoCorreo
						className="col-12 col-md-6"
						id="perfil-correo"
						etiqueta="Correo"
						obligatorio
						autoComplete="email"
						sugerencia="Dominios aceptados: @duoc.cl, @profesor.duoc.cl y @gmail.com."
						{...props("correo")}
					/>
					<Campo
						className="col-12 col-md-6"
						id="perfil-nacimiento"
						etiqueta="Fecha de nacimiento"
						type="date"
						autoComplete="bday"
						sugerencia="Campo opcional."
						{...registrar("fechaNacimiento")}
					/>
					<SelectRegionComuna formulario={formulario} prefijo="perfil" className="col-12 col-md-6" />
					<Campo
						className="col-12"
						id="perfil-direccion"
						etiqueta="Direccion"
						obligatorio
						maxLength={300}
						autoComplete="address-line1"
						sugerencia="Calle, numero y departamento. Hasta 300 caracteres."
						{...props("direccion")}
					/>
				</div>
				<button type="submit" className="btn btn-primary mt-4">
					Guardar mis datos
				</button>
			</form>
		</section>
	);
}

/** Cambio de contrasena: pide la actual y repite la nueva. */
function CambioContrasena({ cuenta }) {
	const { actualizarUsuario } = useDatos();
	const { registrar, estado, errores, enviar, reiniciar } = useFormulario(CONTRASENA_VACIA, CONTRASENA);
	const [aviso, setAviso] = useState(null);

	const alEnviar = (datos) => {
		const rechazo = (contenido) => setAviso({ tipo: "danger", contenido });
		if (datos.actual !== cuenta.contrasena) return rechazo("La contrasena actual no es correcta.");
		if (datos.nueva !== datos.repetir) return rechazo("La contrasena nueva y su repeticion no coinciden.");
		if (datos.nueva === datos.actual) return rechazo("La contrasena nueva debe ser distinta de la actual.");

		const resultado = actualizarUsuario(cuenta.run, { ...cuenta, contrasena: datos.nueva });
		if (!resultado.ok) return rechazo(resultado.mensaje);
		setAviso({ tipo: "success", contenido: "Tu contrasena se cambio correctamente." });
		reiniciar();
	};

	const props = (nombre) => ({ error: errores[nombre], estado: estado(nombre), ...registrar(nombre) });

	return (
		<section className="tarjeta-formulario p-4" aria-labelledby="perfil-contrasena">
			<h2 className="h5 mb-3" id="perfil-contrasena">
				Cambiar contrasena
			</h2>
			<ZonaAviso aviso={aviso} />
			<form noValidate onSubmit={enviar(alEnviar)}>
				<Campo
					className="mb-3"
					id="perfil-actual"
					etiqueta="Contrasena actual"
					obligatorio
					type="password"
					maxLength={10}
					autoComplete="current-password"
					{...props("actual")}
				/>
				<Campo
					className="mb-3"
					id="perfil-nueva"
					etiqueta="Contrasena nueva"
					obligatorio
					type="password"
					maxLength={10}
					autoComplete="new-password"
					sugerencia="Entre 4 y 10 caracteres."
					{...props("nueva")}
				/>
				<Campo
					className="mb-3"
					id="perfil-repetir"
					etiqueta="Repite la contrasena nueva"
					obligatorio
					type="password"
					maxLength={10}
					autoComplete="new-password"
					{...props("repetir")}
				/>
				<button type="submit" className="btn btn-primary">
					Cambiar contrasena
				</button>
			</form>
		</section>
	);
}

/** Perfil de quien tiene la sesion iniciada: sus datos y su contrasena. enPanel lo ubica dentro del panel. */
export default function Perfil({ enPanel = false }) {
	useTitulo(enPanel ? "Mi perfil — Panel Ensambla.me" : "Mi perfil — Ensambla.me");
	const { sesion } = useSesion();
	const { usuarios } = useDatos();
	const cuenta = usuarios.find((usuario) => usuario.run === sesion?.run);

	return (
		<main className={enPanel ? "col-12 col-lg-9" : undefined}>
			<p className="sobretitulo">Mi cuenta</p>
			<h1 className="h3 mb-4">Mi perfil</h1>

			{cuenta ? (
				<div className="row g-4">
					<div className="col-12 col-xl-7">
						{/* key: si cambia la cuenta, el formulario parte de sus datos */}
						<DatosPersonales key={cuenta.run} cuenta={cuenta} />
					</div>
					<div className="col-12 col-xl-5">
						<CambioContrasena key={cuenta.run} cuenta={cuenta} />
					</div>
				</div>
			) : (
				<EstadoVacio>
					<p className="mb-0">No encontramos los datos de tu cuenta. Cierra la sesion e ingresa de nuevo.</p>
				</EstadoVacio>
			)}
		</main>
	);
}
