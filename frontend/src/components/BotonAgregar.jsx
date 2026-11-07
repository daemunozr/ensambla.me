import { useCarrito } from "../context/carrito.js";

/**
 * Boton de anadir al carrito. Un producto sin stock muestra el boton
 * deshabilitado con el texto "Sin stock" (RF-05 CA4).
 */
export default function BotonAgregar({ producto, className, texto = "Anadir al carrito" }) {
	const { agregar } = useCarrito();

	if (Number(producto.stock) <= 0) {
		return (
			<button type="button" className={className} disabled>
				Sin stock
			</button>
		);
	}

	return (
		<button type="button" className={className} onClick={() => agregar(producto.sku)}>
			{texto}
		</button>
	);
}
