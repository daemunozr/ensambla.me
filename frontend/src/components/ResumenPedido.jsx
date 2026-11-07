import { producto as buscarProducto } from "../data/datos.js";
import { precio } from "../utils/formato.js";

/**
 * Resumen de una compra: productos con su cantidad, subtotal, envio y total.
 * items es [{ producto (SKU), cantidad, precioUnitario }]. Con envio en null
 * todavia no se eligio la entrega y se avisa que se calcula despues.
 */
export default function ResumenPedido({ items, subtotal, envio = null, total }) {
	return (
		<section className="resumen-total p-3" aria-labelledby="resumen-pedido-titulo">
			<h2 className="h6" id="resumen-pedido-titulo">
				Resumen del pedido
			</h2>
			<ul className="list-unstyled border-bottom pb-2 mb-2">
				{items.map((item) => (
					<li key={item.producto} className="d-flex justify-content-between gap-3 py-1 small">
						<span>
							{buscarProducto(item.producto)?.nombre ?? item.producto}
							<span className="text-secondary"> x{item.cantidad}</span>
						</span>
						<span className="text-nowrap">{precio(item.cantidad * item.precioUnitario)}</span>
					</li>
				))}
			</ul>
			<dl className="row mb-0">
				<dt className="col-6 fw-normal">Subtotal</dt>
				<dd className="col-6 text-end">{precio(subtotal)}</dd>
				<dt className="col-6 fw-normal">Envio</dt>
				<dd className="col-6 text-end">
					{envio === null ? "Segun la entrega" : envio === 0 ? "Gratis" : precio(envio)}
				</dd>
				<dt className="col-6">Total</dt>
				<dd className="col-6 text-end mb-0">
					<span className="total">{precio(total)}</span>
				</dd>
			</dl>
		</section>
	);
}
