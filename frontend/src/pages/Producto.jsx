import { Link, useParams } from "react-router";
import BotonAgregar from "../components/BotonAgregar.jsx";
import EstadoVacio from "../components/EstadoVacio.jsx";
import ImagenProducto from "../components/ImagenProducto.jsx";
import PrecioProducto from "../components/PrecioProducto.jsx";
import { nombreCategoria, producto as buscarProducto } from "../data/datos.js";
import { useTitulo } from "../hooks/useTitulo.js";
import { recurso } from "../utils/recursos.js";

/** Detalle de un producto con su video opcional y el boton de anadir (RF-04). */
export default function Producto() {
	const { sku = "" } = useParams();
	const producto = sku ? buscarProducto(sku) : null;
	useTitulo(producto ? `${producto.nombre} — Ensambla.me` : "Producto no encontrado — Ensambla.me");

	// Un codigo que no existe avisa, en vez de dejar la vista vacia (RF-04 CA3).
	if (!producto) {
		return (
			<main className="col-12 col-lg-9">
				<h1 className="h3 mb-3">Producto no encontrado</h1>
				<EstadoVacio>
					<p>
						No existe un producto con el codigo <strong>{sku || "(sin codigo)"}</strong> en el catalogo.
					</p>
					<Link className="btn btn-primary" to="/productos">
						Volver al catalogo
					</Link>
				</EstadoVacio>
			</main>
		);
	}

	const categoria = nombreCategoria(producto.categoria);
	const alerta = producto.stockCritico !== "" && producto.stock <= Number(producto.stockCritico);

	return (
		<main className="col-12 col-lg-9">
			<nav aria-label="Ubicacion" className="mb-3">
				<ol className="breadcrumb small mb-0">
					<li className="breadcrumb-item">
						<Link to="/productos">Productos</Link>
					</li>
					<li className="breadcrumb-item">
						<Link to={`/productos?categoria=${encodeURIComponent(producto.categoria)}`}>{categoria}</Link>
					</li>
					<li className="breadcrumb-item active" aria-current="page">
						{producto.sku}
					</li>
				</ol>
			</nav>

			<div className="row g-4">
				<div className="col-12 col-lg-6">
					<ImagenProducto producto={producto} className="imagen-detalle" />
				</div>

				<div className="col-12 col-lg-6">
					<p className="etiqueta-categoria mb-1">{categoria}</p>
					<h1 className="h3">{producto.nombre}</h1>
					<p className="precio">
						<PrecioProducto producto={producto} />
					</p>
					<p>{producto.descripcion || "Este producto todavia no tiene descripcion."}</p>

					<dl className="ficha-tecnica row small">
						<dt className="col-5">Codigo (SKU)</dt>
						<dd className="col-7">{producto.sku}</dd>
						<dt className="col-5">Categoria</dt>
						<dd className="col-7">{categoria}</dd>
						<dt className="col-5">Stock</dt>
						<dd className="col-7">{producto.stock} unidades</dd>
					</dl>

					{alerta && <p className="alerta-stock mb-0">Ultimas unidades disponibles</p>}

					<div className="d-flex flex-wrap gap-2 mt-3">
						<BotonAgregar producto={producto} className="btn btn-primary" />
						<Link className="btn btn-outline-primary" to="/carrito">
							Ir al carrito
						</Link>
					</div>
				</div>
			</div>

			{/* El video solo se incluye si el producto lo define, sin contenedores vacios (RF-04 CA4). */}
			{producto.video && (
				<section className="mt-4">
					<h2 className="h5">Video del producto</h2>
					<video className="video-producto" controls preload="metadata" src={recurso(producto.video)}>
						Tu navegador no puede reproducir este video.
					</video>
				</section>
			)}
		</main>
	);
}
