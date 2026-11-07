import { useReducer, useState } from "react";
import { Link } from "react-router";
import EstadoVacio from "../components/EstadoVacio.jsx";
import PrecioProducto from "../components/PrecioProducto.jsx";
import { useCarrito } from "../context/carrito.js";
import { categoriasDeArmado, nombreCategoria, producto as buscarProducto } from "../data/datos.js";
import { useTitulo } from "../hooks/useTitulo.js";
import {
	armadoReducer,
	elegidos,
	estadoInicial,
	opcionesDe,
	puedeAgregar,
	recorridoCompleto,
} from "../logic/armado.js";
import { precioVigente } from "../logic/precios.js";
import { precio } from "../utils/formato.js";

/* ---------------------------------------------------------- Selector de modo */
function SelectorModo({ estado, despachar, total }) {
	if (estado.modo) {
		return (
			<section className="mb-4">
				<div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
					<p className="mb-0">
						Modo de armado: <strong>{estado.modo === "completo" ? "Equipo completo" : "Por modulos"}</strong>
					</p>
					<button
						type="button"
						className="btn btn-sm btn-outline-primary"
						onClick={() => despachar({ tipo: "reiniciar" })}
					>
						Empezar de nuevo
					</button>
				</div>
			</section>
		);
	}

	return (
		<section className="mb-4">
			<h2 className="h5 titulo-seccion mb-3">Como quieres armarlo</h2>
			<div className="row row-cols-1 row-cols-md-2 g-3">
				<div className="col">
					<article className="card h-100">
						<div className="card-body d-flex flex-column">
							<h3 className="h6 card-title">Equipo completo</h3>
							<p className="card-text small">
								Recorres las {total} categorias, desde el procesador hasta los perifericos, y al terminar
								agregas todo el conjunto al carrito.
							</p>
							<button
								type="button"
								className="btn btn-primary mt-auto"
								onClick={() => despachar({ tipo: "modo", modo: "completo" })}
							>
								Armar equipo completo
							</button>
						</div>
					</article>
				</div>
				<div className="col">
					<article className="card h-100">
						<div className="card-body d-flex flex-column">
							<h3 className="h6 card-title">Por modulos</h3>
							<p className="card-text small">
								Escoges solo lo que necesitas (por ejemplo almacenamiento y memoria), omites el resto y
								finalizas cuando quieras.
							</p>
							<button
								type="button"
								className="btn btn-outline-primary mt-auto"
								onClick={() => despachar({ tipo: "modo", modo: "modulos" })}
							>
								Armar por modulos
							</button>
						</div>
					</article>
				</div>
			</div>
		</section>
	);
}

/* ------------------------------------------------------------ Lista de pasos */
function ListaPasos({ estado, categorias }) {
	if (!estado.modo) return null;

	return (
		<ol className="pasos-armado">
			{categorias.map((categoria, i) => {
				const eleccion = estado.elecciones[i];
				let clase;
				if (i === estado.indice && !estado.agregado) clase = "paso-actual";
				else if (eleccion?.sku) clase = "paso-listo";
				else if (eleccion) clase = "paso-omitido";
				return (
					<li key={categoria.codigo} className={clase}>
						{categoria.nombre}
					</li>
				);
			})}
		</ol>
	);
}

/* ------------------------------------------------------------- Paso actual */
/** Opcion de un componente. Un componente sin stock se muestra pero no se puede escoger (RF-07 CA7). */
function OpcionComponente({ producto, marcado, onElegir }) {
	const sinStock = Number(producto.stock) <= 0;
	const id = `opcion-${producto.sku}`;

	return (
		<div className="col">
			<article className={`card opcion-componente${sinStock ? " opcion-sin-stock" : ""}`}>
				<div className="card-body">
					<div className="form-check">
						<input
							className="form-check-input"
							type="radio"
							name="componente"
							id={id}
							value={producto.sku}
							checked={marcado && !sinStock}
							disabled={sinStock}
							onChange={() => onElegir(producto.sku)}
						/>
						{/* stretched-link extiende la etiqueta a toda la tarjeta: un clic en cualquier parte marca la opcion. */}
						<label className="form-check-label fw-semibold stretched-link" htmlFor={id}>
							{producto.nombre}
							{sinStock ? " (sin stock)" : ""}
						</label>
					</div>
					<p className="precio mb-1">
						<PrecioProducto producto={producto} />
					</p>
					<p className="small text-secondary mb-0">{producto.descripcion}</p>
				</div>
			</article>
		</div>
	);
}

function PasoActual({ estado, despachar, categorias }) {
	const categoria = categorias[estado.indice];
	const [marcado, setMarcado] = useState(estado.elecciones[estado.indice]?.sku ?? "");
	const [error, setError] = useState(false);

	const opciones = opcionesDe(estado, categorias);
	const anterior = estado.elecciones[estado.indice - 1];
	const esUltima = estado.indice === categorias.length - 1;

	const continuar = (evento) => {
		evento.preventDefault();
		if (!marcado) {
			setError(true);
			return;
		}
		despachar({ tipo: "registrar", categoria: categoria.codigo, sku: marcado });
	};

	return (
		<section>
			<h2 className="h5 titulo-seccion mb-1">
				Paso {estado.indice + 1} de {categorias.length}: {categoria.nombre}
			</h2>
			{estado.indice > 0 && anterior?.sku && (
				<p className="small text-secondary">
					Filtrado segun tu eleccion anterior: <strong>{buscarProducto(anterior.sku).nombre}</strong>.
				</p>
			)}

			<form className="mt-3" onSubmit={continuar}>
				<fieldset>
					<legend className="visually-hidden">Componentes disponibles en {categoria.nombre}</legend>
					{opciones.length ? (
						<div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-3">
							{opciones.map((producto) => (
								<OpcionComponente
									key={producto.sku}
									producto={producto}
									marcado={producto.sku === marcado}
									onElegir={(sku) => {
										setMarcado(sku);
										setError(false);
									}}
								/>
							))}
						</div>
					) : (
						<EstadoVacio>
							<p className="mb-0">
								No hay componentes de esta categoria compatibles con tu seleccion anterior. Puedes omitirla
								o volver atras y cambiar el componente previo.
							</p>
						</EstadoVacio>
					)}
				</fieldset>

				{error && (
					<p className="text-danger small mt-2" role="alert">
						Selecciona un componente para continuar.
					</p>
				)}

				<div className="d-flex flex-wrap gap-2 mt-3">
					{estado.indice > 0 && (
						<button
							type="button"
							className="btn btn-outline-secondary"
							onClick={() => despachar({ tipo: "volver" })}
						>
							Volver
						</button>
					)}
					<button type="submit" className="btn btn-primary">
						{esUltima ? "Ver el resumen" : "Continuar"}
					</button>
					{estado.modo === "modulos" && (
						<button
							type="button"
							className="btn btn-outline-primary"
							onClick={() => despachar({ tipo: "omitir", categoria: categoria.codigo })}
						>
							Omitir esta categoria
						</button>
					)}
					{estado.modo === "modulos" && elegidos(estado).length > 0 && (
						<button type="button" className="btn btn-success" onClick={() => despachar({ tipo: "finalizar" })}>
							Finalizar aqui
						</button>
					)}
				</div>
			</form>
		</section>
	);
}

/* ---------------------------------------------------------------- Resumen */
function ResumenArmado({ estado, despachar }) {
	const { agregarArmado } = useCarrito();
	const seleccion = elegidos(estado);
	const completo = recorridoCompleto(estado);

	if (!estado.modo || (!seleccion.length && !estado.agregado)) return null;

	const total = seleccion.reduce((suma, eleccion) => suma + precioVigente(buscarProducto(eleccion.sku)), 0);

	// Si falta stock de algun componente, el carrito avisa y el armado sigue en pantalla (RF-07 CA7).
	const agregar = () => {
		if (agregarArmado(seleccion.map((eleccion) => eleccion.sku))) despachar({ tipo: "agregado" });
	};

	let acciones;
	if (estado.agregado) {
		acciones = (
			<div className="d-flex flex-wrap gap-2">
				<Link className="btn btn-primary" to="/carrito">
					Ir al carrito
				</Link>
				<button type="button" className="btn btn-outline-primary" onClick={() => despachar({ tipo: "reiniciar" })}>
					Armar otro equipo
				</button>
			</div>
		);
	} else if (puedeAgregar(estado)) {
		acciones = (
			<div className="d-flex flex-wrap gap-2">
				<button type="button" className="btn btn-success" onClick={agregar}>
					Agregar el armado al carrito
				</button>
				{!completo && (
					<button type="button" className="btn btn-outline-secondary" onClick={() => despachar({ tipo: "seguir" })}>
						Seguir eligiendo
					</button>
				)}
			</div>
		);
	} else {
		acciones = (
			<p className="small text-secondary mb-0">
				Termina de recorrer las categorias para agregar el equipo completo al carrito.
			</p>
		);
	}

	return (
		<section className="resumen-armado p-3 mt-4">
			<h2 className="h5">Resumen del armado</h2>
			{estado.agregado && (
				<div className="alert alert-success" role="alert">
					El armado se agrego al carrito como un conjunto.
				</div>
			)}
			<ul className="list-unstyled border-top border-bottom py-2 my-3">
				{seleccion.map((eleccion) => {
					const producto = buscarProducto(eleccion.sku);
					return (
						<li key={eleccion.categoria} className="d-flex justify-content-between gap-3 py-1">
							<span>
								<span className="etiqueta-categoria d-block">{nombreCategoria(eleccion.categoria)}</span>
								{producto.nombre}
							</span>
							<span className="text-nowrap">
								<PrecioProducto producto={producto} />
							</span>
						</li>
					);
				})}
			</ul>
			<p className="d-flex justify-content-between align-items-center">
				<span>
					Precio del conjunto ({seleccion.length} {seleccion.length === 1 ? "componente" : "componentes"})
				</span>
				<span className="total">{precio(total)}</span>
			</p>
			{acciones}
		</section>
	);
}

/** Asistente de armado de PC gamer por componentes (RF-07). */
export default function Armado() {
	useTitulo("Armar mi PC — Ensambla.me");
	const categorias = categoriasDeArmado();
	const [estado, despachar] = useReducer(armadoReducer, categorias.length, estadoInicial);
	const mostrarPaso = estado.modo && !estado.agregado && !recorridoCompleto(estado);

	return (
		<main className="col-12 col-lg-9">
			<p className="sobretitulo">Ensambla.me</p>
			<h1 className="h3">Asistente de armado</h1>
			<p className="text-secondary">
				Avanza una categoria a la vez. Cada eleccion filtra las opciones de la categoria siguiente segun la tabla
				de compatibilidad del catalogo.
			</p>

			<SelectorModo estado={estado} despachar={despachar} total={categorias.length} />
			<ListaPasos estado={estado} categorias={categorias} />
			{/* key: cada paso parte con su propia seleccion y sin error. */}
			{mostrarPaso && (
				<PasoActual
					key={`${estado.modo}-${estado.indice}`}
					estado={estado}
					despachar={despachar}
					categorias={categorias}
				/>
			)}
			<ResumenArmado estado={estado} despachar={despachar} />
		</main>
	);
}
