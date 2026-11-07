import { Fragment } from "react";
import { Link } from "react-router";
import { itemsDeOrden, nombreCliente, producto, totalOrden } from "../data/datos.js";
import { masRecientesPrimero } from "../logic/ordenes.js";
import { fecha, precio } from "../utils/formato.js";
import EstadoVacio from "./EstadoVacio.jsx";

/**
 * Tabla de ordenes, de la mas reciente a la mas antigua: numero, fecha, cliente
 * (si conCliente), productos, total y el enlace a su boleta. rutaDetalle recibe
 * el numero de la orden y devuelve la ruta de su boleta.
 */
export default function TablaOrdenes({
	ordenes,
	rutaDetalle,
	conCliente = false,
	titulo = "Listado de ordenes de compra",
	mensajeVacio = "No hay ordenes registradas.",
}) {
	if (!ordenes.length) {
		return (
			<EstadoVacio>
				<p className="mb-0">{mensajeVacio}</p>
			</EstadoVacio>
		);
	}

	return (
		<div className="table-responsive">
			<table className="table table-hover tabla-admin align-middle">
				<caption className="visually-hidden">{titulo}</caption>
				<thead>
					<tr>
						<th scope="col">Orden</th>
						{conCliente && <th scope="col">Cliente</th>}
						<th scope="col">Fecha</th>
						<th scope="col">Productos</th>
						<th scope="col" className="text-end">Total</th>
						<th scope="col" className="text-end">Boleta</th>
					</tr>
				</thead>
				<tbody>
					{masRecientesPrimero(ordenes).map((orden) => (
						<tr key={orden.numero}>
							<td>
								<code>{orden.numero}</code>
							</td>
							{conCliente && (
								<td>
									{orden.cliente ? nombreCliente(orden.cliente) : orden.nombre}
									<br />
									<span className="small text-secondary">{orden.cliente || "Invitado"}</span>
								</td>
							)}
							<td>{fecha(orden.fecha)}</td>
							<td className="small">
								{itemsDeOrden(orden.numero).map((item, i) => (
									<Fragment key={item.producto}>
										{i > 0 && <br />}
										{producto(item.producto)?.nombre ?? item.producto} (x{item.cantidad})
									</Fragment>
								))}
							</td>
							<td className="text-end">{precio(totalOrden(orden.numero))}</td>
							<td className="text-end">
								<Link className="btn btn-sm btn-outline-primary" to={rutaDetalle(orden.numero)}>
									Ver boleta
								</Link>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
