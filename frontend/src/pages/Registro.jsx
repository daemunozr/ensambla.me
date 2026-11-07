import { useState } from "react";
import { Link } from "react-router";
import { ZonaAviso } from "../components/Alerta.jsx";
import Campo from "../components/Campo.jsx";
import CampoCorreo from "../components/CampoCorreo.jsx";
import SelectRegionComuna from "../components/SelectRegionComuna.jsx";
import { useDatos } from "../context/datos.js";
import { useFormulario } from "../hooks/useFormulario.js";
import { useTitulo } from "../hooks/useTitulo.js";
import { reglas } from "../utils/validaciones.js";

const INICIAL = {
	run: "",
	nombre: "",
	apellidos: "",
	correo: "",
	contrasena: "",
	fechaNacimiento: "",
	region: "",
	comuna: "",
	direccion: "",
};

const DEFINICION = {
	run: [reglas.requerido(), reglas.run()],
	nombre: [reglas.requerido(), reglas.maximo(50)],
	apellidos: [reglas.requerido(), reglas.maximo(100)],
	correo: [reglas.requerido(), reglas.maximo(100), reglas.correo()],
	contrasena: [reglas.requerido(), reglas.contrasena()],
	region: [reglas.seleccion("Selecciona tu region.")],
	comuna: [reglas.seleccion("Selecciona tu comuna.")],
	direccion: [reglas.requerido(), reglas.maximo(300)],
};

/** Registro de un nuevo cliente. El rol no se escoge aqui: siempre es Cliente (RF-01). */
export default function Registro() {
	useTitulo("Registro — Ensambla.me");
	const { crearUsuario } = useDatos();
	const formulario = useFormulario(INICIAL, DEFINICION);
	const { registrar, estado, errores, enviar, reiniciar } = formulario;
	const [aviso, setAviso] = useState(null);

	const alEnviar = (datos) => {
		// La unicidad del RUN y del correo la aplica la capa de datos.
		const resultado = crearUsuario({
			run: datos.run,
			nombre: datos.nombre,
			apellidos: datos.apellidos,
			correo: datos.correo,
			contrasena: datos.contrasena,
			fechaNacimiento: datos.fechaNacimiento || "",
			comuna: datos.comuna,
			direccion: datos.direccion,
			tipoUsuario: "CLIENTE",
		});
		if (!resultado.ok) {
			setAviso({ tipo: "danger", contenido: resultado.mensaje });
			return;
		}
		const { correo } = resultado.registro;

		setAviso({
			tipo: "success",
			contenido: (
				<>
					Cuenta creada para {datos.nombre} {datos.apellidos}. Ya puedes <Link to="/login">iniciar sesion</Link> con{" "}
					{correo}.
				</>
			),
		});
		reiniciar();
	};

	return (
		<main>
			<p className="sobretitulo">Crear cuenta</p>
			<h1 className="h3">Registro de cliente</h1>
			<p className="text-secondary mb-4">
				Con tu cuenta puedes comprar, guardar tus armados y revisar tus datos de despacho.
			</p>

			<section className="tarjeta-formulario p-4">
				<ZonaAviso aviso={aviso} />

				<form noValidate onSubmit={enviar(alEnviar)}>
					<div className="row g-3">
						<Campo
							className="col-12 col-md-4"
							id="registro-run"
							etiqueta="RUN"
							obligatorio
							maxLength={9}
							autoComplete="off"
							sugerencia="Sin puntos ni guion, con el digito verificador. Ejemplo: 190110222."
							error={errores.run}
							estado={estado("run")}
							{...registrar("run")}
						/>
						<Campo
							className="col-12 col-md-4"
							id="registro-nombre"
							etiqueta="Nombre"
							obligatorio
							maxLength={50}
							autoComplete="given-name"
							sugerencia="Hasta 50 caracteres."
							error={errores.nombre}
							estado={estado("nombre")}
							{...registrar("nombre")}
						/>
						<Campo
							className="col-12 col-md-4"
							id="registro-apellidos"
							etiqueta="Apellidos"
							obligatorio
							maxLength={100}
							autoComplete="family-name"
							sugerencia="Hasta 100 caracteres."
							error={errores.apellidos}
							estado={estado("apellidos")}
							{...registrar("apellidos")}
						/>
						<CampoCorreo
							className="col-12 col-md-6"
							id="registro-correo"
							etiqueta="Correo"
							obligatorio
							autoComplete="email"
							sugerencia="Dominios aceptados: @duoc.cl, @profesor.duoc.cl y @gmail.com."
							error={errores.correo}
							estado={estado("correo")}
							{...registrar("correo")}
						/>
						<Campo
							className="col-12 col-md-6"
							id="registro-contrasena"
							etiqueta="Contrasena"
							obligatorio
							type="password"
							maxLength={10}
							autoComplete="new-password"
							sugerencia="Entre 4 y 10 caracteres."
							error={errores.contrasena}
							estado={estado("contrasena")}
							{...registrar("contrasena")}
						/>
						<Campo
							className="col-12 col-md-4"
							id="registro-nacimiento"
							etiqueta="Fecha de nacimiento"
							type="date"
							autoComplete="bday"
							sugerencia="Campo opcional."
							{...registrar("fechaNacimiento")}
						/>
						<SelectRegionComuna formulario={formulario} prefijo="registro" />
						<Campo
							className="col-12"
							id="registro-direccion"
							etiqueta="Direccion"
							obligatorio
							maxLength={300}
							autoComplete="address-line1"
							sugerencia="Calle, numero y departamento. Hasta 300 caracteres."
							error={errores.direccion}
							estado={estado("direccion")}
							{...registrar("direccion")}
						/>
					</div>

					<div className="d-flex flex-wrap gap-2 mt-4">
						<button type="submit" className="btn btn-primary">
							Crear mi cuenta
						</button>
						<Link className="btn btn-outline-primary" to="/login">
							Ya tengo cuenta
						</Link>
					</div>
				</form>
			</section>
		</main>
	);
}
