import EstadoVacio from "./EstadoVacio.jsx";
import TarjetaProducto from "./TarjetaProducto.jsx";

/**
 * Rejilla de tarjetas generada desde los datos (RF-03 CA1). Sin productos
 * muestra un aviso en lugar de un area en blanco (RF-03 CA3).
 */
export default function RejillaProductos({ productos, mensajeVacio, nivel = 3 }) {
	if (!productos.length) {
		return (
			<EstadoVacio>
				<p className="mb-0">{mensajeVacio}</p>
			</EstadoVacio>
		);
	}

	return (
		<div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-3">
			{productos.map((producto) => (
				<TarjetaProducto key={producto.sku} producto={producto} nivel={nivel} />
			))}
		</div>
	);
}
