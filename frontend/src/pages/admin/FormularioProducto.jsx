import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ZonaAviso } from "../../components/Alerta.jsx";
import Campo from "../../components/Campo.jsx";
import { useDatos } from "../../context/datos.js";
import { producto as buscarProducto } from "../../data/datos.js";
import { useFormulario } from "../../hooks/useFormulario.js";
import { useTitulo } from "../../hooks/useTitulo.js";
import { MAXIMO_DESCUENTO, precioVigente } from "../../logic/precios.js";
import { precioOGratis } from "../../utils/formato.js";
import { reglas } from "../../utils/validaciones.js";

const VACIO = {
	sku: "",
	nombre: "",
	descripcion: "",
	precio: "",
	descuento: "",
	stock: "",
	stockCritico: "",
	categoria: "",
	imagen: "",
	video: "",
};

const DEFINICION = {
	sku: [reglas.requerido(), reglas.minimo(3)],
	nombre: [reglas.requerido(), reglas.maximo(100)],
	descripcion: [reglas.maximo(500)],
	precio: [reglas.requerido(), reglas.numeroMinimo(0)],
	descuento: [reglas.numeroMinimo(0), reglas.numeroMaximo(MAXIMO_DESCUENTO), reglas.entero()],
	stock: [reglas.requerido(), reglas.numeroMinimo(0), reglas.entero()],
	stockCritico: [reglas.numeroMinimo(0), reglas.entero()],
	categoria: [reglas.seleccion("Selecciona la categoria del producto.")],
};

/** Valores del formulario a partir de un producto existente (los numeros como texto). */
const valoresDe = (existente) =>
	Object.fromEntries(Object.keys(VACIO).map((campo) => [campo, String(existente[campo] ?? "")]));

function Formulario({ sku }) {
	const navegar = useNavigate();
	const { categorias, crearProducto, actualizarProducto } = useDatos();
	const existente = sku ? buscarProducto(sku) : null;
	const formulario = useFormulario(existente ? valoresDe(existente) : VACIO, DEFINICION);
	const { registrar, estado, errores, enviar, valores } = formulario;
	const [aviso, setAviso] = useState(
		sku && !existente ? { tipo: "danger", contenido: `No existe un producto con el codigo ${sku}.` } : null,
	);
	useTitulo(existente ? `Editar ${existente.nombre} — Panel Ensambla.me` : "Ficha de producto — Panel Ensambla.me");

	const alEnviar = (datos) => {
		const registro = {
			sku: datos.sku,
			nombre: datos.nombre,
			descripcion: datos.descripcion,
			precio: Number(datos.precio),
			descuento: datos.descuento === "" ? "" : Number(datos.descuento),
			stock: Number(datos.stock),
			stockCritico: datos.stockCritico === "" ? "" : Number(datos.stockCritico),
			categoria: datos.categoria,
			imagen: datos.imagen,
			video: datos.video,
		};

		// La capa de datos rechaza un SKU repetido al crear.
		const resultado = existente ? actualizarProducto(existente.sku, registro) : crearProducto(registro);
		if (!resultado.ok) {
			setAviso({ tipo: "danger", contenido: resultado.mensaje });
			return;
		}
		navegar(`/admin/productos?guardado=${encodeURIComponent(registro.sku)}`);
	};

	const props = (nombre) => ({ error: errores[nombre], estado: estado(nombre), ...registrar(nombre) });

	return (
		<main className="col-12 col-lg-9">
			<p className="sobretitulo">Mantenedor de productos</p>
			<h1 className="h3">{existente ? `Editar ${existente.nombre}` : "Nuevo producto"}</h1>
			<p className="text-secondary mb-4">
				Los campos marcados con <span className="obligatorio" aria-hidden="true">*</span> son obligatorios. Para
				eliminar un producto usa el boton Eliminar del listado.
			</p>

			<section className="tarjeta-formulario p-4">
				<ZonaAviso aviso={aviso} />

				<form noValidate onSubmit={enviar(alEnviar)}>
					<div className="row g-3">
						<Campo
							className="col-12 col-md-4"
							id="producto-sku"
							etiqueta="Codigo de producto (SKU)"
							obligatorio
							autoComplete="off"
							readOnly={Boolean(existente)}
							sugerencia="Texto unico, al menos 3 caracteres. Ejemplo: GPU-RTX4060."
							{...props("sku")}
						/>
						<Campo
							className="col-12 col-md-8"
							id="producto-nombre"
							etiqueta="Nombre"
							obligatorio
							maxLength={100}
							autoComplete="off"
							sugerencia="Hasta 100 caracteres."
							{...props("nombre")}
						/>
						<Campo
							como="textarea"
							className="col-12"
							id="producto-descripcion"
							etiqueta="Descripcion"
							rows={3}
							maxLength={500}
							autoComplete="off"
							sugerencia="Opcional, hasta 500 caracteres. Se muestra en el detalle del producto."
							{...props("descripcion")}
						/>
						<Campo
							className="col-12 col-md-4"
							id="producto-precio"
							etiqueta="Precio"
							obligatorio
							type="number"
							min="0"
							step="0.01"
							autoComplete="off"
							sugerencia="Pesos chilenos, admite decimales. Un precio 0 es un producto gratuito."
							{...props("precio")}
						/>
						<Campo
							className="col-12 col-md-4"
							id="producto-descuento"
							etiqueta="Descuento (%)"
							type="number"
							min="0"
							max={MAXIMO_DESCUENTO}
							step="1"
							autoComplete="off"
							sugerencia={`Opcional. Entero de 0 a ${MAXIMO_DESCUENTO}; vacio o 0 es sin oferta.`}
							{...props("descuento")}
						/>
						<div className="col-12 col-md-4">
							<label className="form-label" htmlFor="producto-precio-final">
								Precio final
							</label>
							<output id="producto-precio-final" htmlFor="producto-precio producto-descuento" className="precio d-block mb-1">
								{valores.precio === "" || errores.precio || errores.descuento
									? "—"
									: precioOGratis(precioVigente({ precio: valores.precio, descuento: valores.descuento }))}
							</output>
							<p className="form-text mb-0">Precio con el descuento aplicado, el que paga el cliente.</p>
						</div>
						<Campo
							className="col-12 col-md-4"
							id="producto-stock"
							etiqueta="Stock"
							obligatorio
							type="number"
							min="0"
							step="1"
							autoComplete="off"
							sugerencia="Unidades en inventario, solo numeros enteros."
							{...props("stock")}
						/>
						<Campo
							className="col-12 col-md-4"
							id="producto-stock-critico"
							etiqueta="Stock critico"
							type="number"
							min="0"
							step="1"
							autoComplete="off"
							sugerencia="Opcional. Bajo este umbral el listado muestra una alerta."
							{...props("stockCritico")}
						/>
						<Campo
							como="select"
							className="col-12 col-md-4"
							id="producto-categoria"
							etiqueta="Categoria"
							obligatorio
							autoComplete="off"
							sugerencia="Categorias del catalogo."
							{...props("categoria")}
						>
							<option value="">Selecciona una categoria</option>
							{categorias.map((categoria) => (
								<option key={categoria.codigo} value={categoria.codigo}>
									{categoria.nombre}
								</option>
							))}
						</Campo>
						<Campo
							className="col-12 col-md-4"
							id="producto-imagen"
							etiqueta="Imagen"
							autoComplete="off"
							sugerencia="Opcional. Ruta relativa a public/, por ejemplo resources/img/productos/GPU-RTX4060.webp."
							{...registrar("imagen")}
						/>
						<Campo
							className="col-12 col-md-4"
							id="producto-video"
							etiqueta="Video"
							autoComplete="off"
							sugerencia="Opcional. Se muestra embebido en el detalle del producto."
							{...registrar("video")}
						/>
					</div>

					<div className="d-flex flex-wrap gap-2 mt-4">
						<button type="submit" className="btn btn-primary">
							Guardar producto
						</button>
						<Link className="btn btn-outline-primary" to="/admin/productos">
							Volver al listado
						</Link>
					</div>
				</form>
			</section>
		</main>
	);
}

/** Creacion (/admin/productos/nuevo) y edicion (/admin/productos/:sku/editar) de productos (RF-10). */
export default function FormularioProducto() {
	const { sku = "" } = useParams();
	// key: al pasar de un producto a otro el formulario parte de cero.
	return <Formulario key={sku} sku={sku} />;
}
