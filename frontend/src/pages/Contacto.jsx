import { useState } from "react";
import { ZonaAviso } from "../components/Alerta.jsx";
import Campo from "../components/Campo.jsx";
import CampoCorreo from "../components/CampoCorreo.jsx";
import { useFormulario } from "../hooks/useFormulario.js";
import { useTitulo } from "../hooks/useTitulo.js";
import { reglas } from "../utils/validaciones.js";

const INICIAL = { nombre: "", correo: "", comentario: "" };

const DEFINICION = {
	nombre: [reglas.requerido(), reglas.maximo(100)],
	correo: [reglas.requerido(), reglas.maximo(100), reglas.correo()],
	comentario: [reglas.requerido(), reglas.maximo(500)],
};

/** Formulario de contacto: mensaje interno a la empresa (RF-08). */
export default function Contacto() {
	useTitulo("Contacto — Ensambla.me");
	const formulario = useFormulario(INICIAL, DEFINICION);
	const { registrar, estado, errores, enviar, reiniciar } = formulario;
	const [aviso, setAviso] = useState(null);

	const alEnviar = (datos) => {
		setAviso({
			tipo: "success",
			contenido: `Gracias ${datos.nombre}, recibimos tu mensaje. Te responderemos a ${datos.correo.toLowerCase()} en dias habiles.`,
		});
		reiniciar();
	};

	return (
		<main>
			<p className="sobretitulo">Escribenos</p>
			<h1 className="h3">Contacto</h1>
			<p className="text-secondary mb-4">
				Dudas de compatibilidad, cotizaciones o estado de un pedido: respondemos en dias habiles.
			</p>

			<div className="row g-4">
				<div className="col-12 col-lg-7">
					<section className="tarjeta-formulario p-4">
						<h2 className="h5 mb-3">Formulario de contacto</h2>
						<ZonaAviso aviso={aviso} />

						<form noValidate onSubmit={enviar(alEnviar)}>
							<Campo
								className="mb-3"
								id="contacto-nombre"
								etiqueta="Nombre"
								obligatorio
								maxLength={100}
								autoComplete="name"
								sugerencia="Hasta 100 caracteres."
								error={errores.nombre}
								estado={estado("nombre")}
								{...registrar("nombre")}
							/>

							<CampoCorreo
								className="mb-3"
								id="contacto-correo"
								etiqueta="Correo"
								obligatorio
								autoComplete="email"
								sugerencia="Solo aceptamos correos @duoc.cl, @profesor.duoc.cl y @gmail.com."
								error={errores.correo}
								estado={estado("correo")}
								{...registrar("correo")}
							/>

							<Campo
								como="textarea"
								className="mb-3"
								id="contacto-comentario"
								etiqueta="Comentario"
								obligatorio
								rows={5}
								maxLength={500}
								autoComplete="off"
								sugerencia="Hasta 500 caracteres. Cuentanos tu caso con detalle."
								error={errores.comentario}
								estado={estado("comentario")}
								{...registrar("comentario")}
							/>

							<button type="submit" className="btn btn-primary">
								Enviar mensaje
							</button>
						</form>
					</section>
				</div>

				<div className="col-12 col-lg-5">
					<section className="card">
						<div className="card-body">
							<h2 className="h6 card-title">Datos de la tienda</h2>
							<address className="small mb-0">
								<strong>Ensambla.me SpA</strong>
								<br />
								Av. Vicuna Mackenna 4860, Macul, Santiago
								<br />
								Lunes a viernes de 10:00 a 19:00
								<br />
								Telefono: +56 2 2345 6789
								<br />
								Correo: <a href="mailto:contacto@ensambla.me">contacto@ensambla.me</a>
							</address>
						</div>
					</section>
				</div>
			</div>
		</main>
	);
}
