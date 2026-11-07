import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ZonaAviso } from "../../components/Alerta.jsx";
import Campo from "../../components/Campo.jsx";
import { useDatos } from "../../context/datos.js";
import { categoria as buscarCategoria } from "../../data/datos.js";
import { useFormulario } from "../../hooks/useFormulario.js";
import { useTitulo } from "../../hooks/useTitulo.js";
import { reglas } from "../../utils/validaciones.js";

const VACIO = { codigo: "", nombre: "" };

const DEFINICION = {
	codigo: [
		reglas.requerido(),
		reglas.minimo(3),
		reglas.maximo(30),
		reglas.patron(/^[a-z0-9-]+$/, "Usa solo minusculas, numeros y guiones, sin espacios ni tildes."),
	],
	nombre: [reglas.requerido(), reglas.maximo(50)],
};

function Formulario({ codigo }) {
	const navegar = useNavigate();
	const { crearCategoria, actualizarCategoria } = useDatos();
	const existente = codigo ? buscarCategoria(codigo) : null;
	const { registrar, estado, errores, enviar } = useFormulario(
		existente ? { codigo: existente.codigo, nombre: existente.nombre } : VACIO,
		DEFINICION,
	);
	const [aviso, setAviso] = useState(
		codigo && !existente ? { tipo: "danger", contenido: `No existe una categoria con el codigo ${codigo}.` } : null,
	);
	useTitulo(existente ? `Editar ${existente.nombre} — Panel Ensambla.me` : "Nueva categoria — Panel Ensambla.me");

	const alEnviar = (datos) => {
		// La capa de datos rechaza un codigo repetido al crear.
		const resultado = existente ? actualizarCategoria(existente.codigo, datos) : crearCategoria(datos);
		if (!resultado.ok) {
			setAviso({ tipo: "danger", contenido: resultado.mensaje });
			return;
		}
		navegar(`/admin/categorias?guardada=${encodeURIComponent(resultado.registro.nombre)}`);
	};

	const props = (nombre) => ({ error: errores[nombre], estado: estado(nombre), ...registrar(nombre) });

	return (
		<main className="col-12 col-lg-9">
			<p className="sobretitulo">Mantenedor de categorias</p>
			<h1 className="h3">{existente ? `Editar ${existente.nombre}` : "Nueva categoria"}</h1>
			<p className="text-secondary mb-4">
				Las categorias nuevas aparecen en el catalogo y en la ficha de producto. El recorrido del asistente de
				armado no cambia: depende de la tabla de compatibilidad.
			</p>

			<section className="tarjeta-formulario p-4">
				<ZonaAviso aviso={aviso} />

				<form noValidate onSubmit={enviar(alEnviar)}>
					<div className="row g-3">
						<Campo
							className="col-12 col-md-5"
							id="categoria-codigo"
							etiqueta="Codigo"
							obligatorio
							maxLength={30}
							autoComplete="off"
							readOnly={Boolean(existente)}
							sugerencia={
								existente
									? "El codigo identifica a la categoria y no se cambia."
									: "Entre 3 y 30 caracteres: minusculas, numeros y guiones. Ejemplo: monitores."
							}
							{...props("codigo")}
						/>
						<Campo
							className="col-12 col-md-7"
							id="categoria-nombre"
							etiqueta="Nombre"
							obligatorio
							maxLength={50}
							autoComplete="off"
							sugerencia="Hasta 50 caracteres. Es el texto de la barra lateral del catalogo."
							{...props("nombre")}
						/>
					</div>

					{existente?.orden && (
						<p className="small text-secondary mt-3 mb-0">
							Esta categoria es el paso {existente.orden} del asistente de armado.
						</p>
					)}

					<div className="d-flex flex-wrap gap-2 mt-4">
						<button type="submit" className="btn btn-primary">
							Guardar categoria
						</button>
						<Link className="btn btn-outline-primary" to="/admin/categorias">
							Volver al listado
						</Link>
					</div>
				</form>
			</section>
		</main>
	);
}

/** Creacion (/admin/categorias/nueva) y edicion (/admin/categorias/:codigo/editar). */
export default function FormularioCategoria() {
	const { codigo = "" } = useParams();
	return <Formulario key={codigo} codigo={codigo} />;
}
