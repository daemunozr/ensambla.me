import { useEffect, useRef } from "react";
import { Link } from "react-router";
import EstadoVacio from "../components/EstadoVacio.jsx";
import ImagenProducto from "../components/ImagenProducto.jsx";
import PrecioProducto from "../components/PrecioProducto.jsx";
import { useCarrito } from "../context/carrito.js";
import { nombreCategoria, producto as buscarProducto } from "../data/datos.js";
import { useTitulo } from "../hooks/useTitulo.js";
import { agrupar, disponible, subtotal } from "../logic/carrito.js";
import { precio, unidades } from "../utils/formato.js";

/** Una linea del carrito con su cantidad editable y el boton de eliminar (RF-06). */
function LineaCarrito({ linea, lineas, nivel = 2 }) {
	const { cambiarCantidad, eliminarLinea } = useCarrito();
	const producto = buscarProducto(linea.producto);
	const Titulo = `h${nivel}`;
	// Tope de esta linea: el stock menos lo que ocupan las demas lineas del producto.
	const tope = Math.max(linea.cantidad, disponible(lineas, producto.sku, linea.linea));
	const idCantidad = `cantidad-${linea.linea}`;
	const campo = useRef(null);

	// Igual que en un formulario sin React, la cantidad se aplica en el evento
	// "change" (al confirmar, salir del campo o usar las flechas) y no en cada
	// tecla: asi se puede escribir "12" sin pasar por 1.
	useEffect(() => {
		const input = campo.current;
		const alCambiar = () => cambiarCantidad(linea.linea, input.value);
		input.addEventListener("change", alCambiar);
		return () => input.removeEventListener("change", alCambiar);
	}, [linea.linea, cambiarCantidad]);

	// Tras cada cambio (incluso si se ajusto al mismo tope) el campo muestra la
	// cantidad real: cada operacion entrega un objeto de linea nuevo.
	useEffect(() => {
		campo.current.value = String(linea.cantidad);
	}, [linea]);

	return (
		<article className="linea-carrito card mb-3">
			<div className="card-body d-flex flex-wrap align-items-center gap-3">
				<ImagenProducto producto={producto} className="imagen-linea" />

				<div className="flex-grow-1">
					<Titulo className="h6 mb-1">
						<Link className="enlace-producto" to={`/productos/${encodeURIComponent(producto.sku)}`}>
							{producto.nombre}
						</Link>
					</Titulo>
					<p className="etiqueta-categoria mb-1">{nombreCategoria(producto.categoria)}</p>
					<p className="small mb-0">
						Precio unitario: <PrecioProducto producto={producto} />
					</p>
					<p className="small text-secondary mb-0">Puedes llevar hasta {unidades(tope)}.</p>
				</div>

				<div>
					<label className="form-label small mb-1" htmlFor={idCantidad}>
						Cantidad
					</label>
					<input
						ref={campo}
						type="number"
						className="form-control cantidad-linea"
						id={idCantidad}
						name={idCantidad}
						min="1"
						max={tope}
						step="1"
						defaultValue={linea.cantidad}
						autoComplete="off"
					/>
				</div>

				<p className="precio mb-0 text-end">{precio(subtotal(linea))}</p>

				<button type="button" className="btn btn-sm btn-outline-danger" onClick={() => eliminarLinea(linea.linea)}>
					Eliminar
				</button>
			</div>
		</article>
	);
}

/** Armado agregado como conjunto: detalle de componentes y precio sumado (RF-07 CA5). */
function GrupoArmado({ agrupador, suyas, lineas }) {
	const { eliminarArmado } = useCarrito();
	const precioConjunto = suyas.reduce((suma, linea) => suma + subtotal(linea), 0);

	return (
		<section className="grupo-armado mb-4">
			<header className="encabezado-armado d-flex flex-wrap justify-content-between align-items-center gap-2 p-3">
				<div>
					<h2 className="h6 mb-1">Armado personalizado</h2>
					<p className="small mb-0">
						Conjunto {agrupador} &middot; {suyas.length} {suyas.length === 1 ? "componente" : "componentes"}
					</p>
				</div>
				<div className="d-flex align-items-center gap-3">
					<p className="precio mb-0">{precio(precioConjunto)}</p>
					<button type="button" className="btn btn-sm btn-outline-danger" onClick={() => eliminarArmado(agrupador)}>
						Quitar el armado
					</button>
				</div>
			</header>
			<div className="p-3">
				{suyas.map((linea) => (
					<LineaCarrito key={linea.linea} linea={linea} lineas={lineas} nivel={3} />
				))}
			</div>
		</section>
	);
}

/** Contenido del carrito, armados agrupados y total (RF-06). */
export default function Carrito() {
	useTitulo("Carrito — Ensambla.me");
	const { lineas, total } = useCarrito();

	const { sueltas, armados } = agrupar(lineas);

	return (
		<main className="col-12 col-lg-9">
			<p className="sobretitulo">Tu compra</p>
			<h1 className="h3">Carrito de compras</h1>
			<p className="text-secondary">El contenido del carrito se conserva en este navegador aunque cierres la pestana.</p>

			<div className="row g-4">
				<div className="col-12 col-xl-8">
					{lineas.length ? (
						<>
							{Object.entries(armados).map(([agrupador, suyas]) => (
								<GrupoArmado key={agrupador} agrupador={agrupador} suyas={suyas} lineas={lineas} />
							))}
							{sueltas.map((linea) => (
								<LineaCarrito key={linea.linea} linea={linea} lineas={lineas} />
							))}
						</>
					) : (
						<EstadoVacio>
							<p className="mb-3">Tu carrito esta vacio.</p>
							<Link className="btn btn-primary" to="/productos">
								Ver el catalogo
							</Link>
						</EstadoVacio>
					)}
				</div>

				<div className="col-12 col-xl-4">
					<section className="resumen-total p-3">
						<h2 className="h6">Resumen</h2>
						<dl className="row mb-2">
							<dt className="col-6">Total</dt>
							<dd className="col-6 text-end mb-0">
								<span className="total">{precio(total)}</span>
							</dd>
						</dl>
						<p className="small text-secondary">El costo de envio se calcula en el pago, segun la entrega.</p>
						{lineas.length ? (
							<Link className="btn btn-primary w-100 mb-2" to="/checkout">
								Ir a pagar
							</Link>
						) : (
							<button type="button" className="btn btn-primary w-100 mb-2" disabled>
								Ir a pagar
							</button>
						)}
						<Link className="btn btn-outline-primary w-100" to="/productos">
							Seguir comprando
						</Link>
					</section>
				</div>
			</div>
		</main>
	);
}
