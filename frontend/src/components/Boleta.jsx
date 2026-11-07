import { entregaDe } from "../logic/checkout.js";
import { desgloseIva, subtotalItems } from "../logic/ordenes.js";
import { nombreComuna, producto as buscarProducto } from "../data/datos.js";
import { fecha, precio } from "../utils/formato.js";

/**
 * Boleta de una orden: comprador, despacho, detalle de productos y totales con
 * el IVA incluido desglosado. Es un comprobante simulado, sin validez tributaria.
 * orden es el registro de la orden e items sus lineas [{ producto, cantidad, precioUnitario }].
 */
export default function Boleta({ orden, items }) {
	const subtotal = subtotalItems(items);
	const total = subtotal + (orden.costoEnvio ?? 0);
	const { neto, iva } = desgloseIva(total);
	const entrega = entregaDe(orden.entrega)?.nombre ?? "—";

	return (
		<article className="boleta p-4 mb-4" aria-labelledby="boleta-titulo">
			<header className="encabezado-boleta d-flex flex-wrap justify-content-between gap-3 pb-3 mb-3">
				<div>
					<p className="etiqueta-categoria mb-1">Ensambla.me</p>
					<h2 className="h4 mb-0" id="boleta-titulo">
						Boleta {orden.numero}
					</h2>
					<p className="small text-secondary mb-0">Comprobante simulado, sin validez tributaria.</p>
				</div>
				<p className="mb-0 text-md-end">
					<span className="d-block small text-secondary">Fecha</span>
					{fecha(orden.fecha)}
				</p>
			</header>

			<dl className="row small mb-4">
				<dt className="col-4 col-md-3">Comprador</dt>
				<dd className="col-8 col-md-9">
					{orden.nombre}
					<span className="d-block text-secondary">
						{orden.cliente ? `RUN ${orden.cliente}` : "Invitado (sin cuenta)"} &middot; {orden.correo}
					</span>
				</dd>
				<dt className="col-4 col-md-3">Entrega</dt>
				<dd className="col-8 col-md-9">
					{entrega}
					{orden.entrega === "DOMICILIO" && (
						<span className="d-block text-secondary">
							{orden.direccion}, {nombreComuna(orden.comuna)}
						</span>
					)}
				</dd>
				<dt className="col-4 col-md-3">Medio de pago</dt>
				<dd className="col-8 col-md-9">{orden.medioPago || "—"}</dd>
			</dl>

			<div className="table-responsive">
				<table className="table tabla-admin">
					<caption className="visually-hidden">Detalle de los productos de la orden {orden.numero}</caption>
					<thead>
						<tr>
							<th scope="col">Codigo</th>
							<th scope="col">Producto</th>
							<th scope="col" className="text-end">Cantidad</th>
							<th scope="col" className="text-end">Precio unitario</th>
							<th scope="col" className="text-end">Subtotal</th>
						</tr>
					</thead>
					<tbody>
						{items.map((item) => (
							<tr key={item.producto}>
								<td>
									<code>{item.producto}</code>
								</td>
								<td>{buscarProducto(item.producto)?.nombre || "Producto fuera del catalogo"}</td>
								<td className="text-end">{item.cantidad}</td>
								<td className="text-end">{precio(item.precioUnitario)}</td>
								<td className="text-end">{precio(item.cantidad * item.precioUnitario)}</td>
							</tr>
						))}
					</tbody>
					<tfoot>
						<tr>
							<th scope="row" colSpan={4} className="text-end fw-normal">
								Subtotal
							</th>
							<td className="text-end">{precio(subtotal)}</td>
						</tr>
						<tr>
							<th scope="row" colSpan={4} className="text-end fw-normal">
								Envio
							</th>
							<td className="text-end">{orden.costoEnvio ? precio(orden.costoEnvio) : "Gratis"}</td>
						</tr>
						<tr>
							<th scope="row" colSpan={4} className="text-end">
								Total
							</th>
							<td className="text-end precio">{precio(total)}</td>
						</tr>
					</tfoot>
				</table>
			</div>

			<p className="small text-secondary mb-3">
				El total incluye IVA: neto {precio(neto)} + IVA (19%) {precio(iva)}.
			</p>

			<button type="button" className="btn btn-outline-primary no-imprimir" onClick={() => window.print()}>
				Imprimir boleta
			</button>
		</article>
	);
}
