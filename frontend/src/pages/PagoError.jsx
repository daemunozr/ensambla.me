import { Link, useLocation } from "react-router";
import Alerta from "../components/Alerta.jsx";
import EstadoVacio from "../components/EstadoVacio.jsx";
import ResumenPedido from "../components/ResumenPedido.jsx";
import { useCarrito } from "../context/carrito.js";
import { producto as buscarProducto } from "../data/datos.js";
import { useTitulo } from "../hooks/useTitulo.js";
import { consolidar, costoEnvio } from "../logic/checkout.js";

/**
 * Pago rechazado: el motivo, el resumen del pedido (el carrito sigue intacto,
 * sin cobro ni cambio de stock) y el regreso al Checkout con los datos de envio.
 */
export default function PagoError() {
	useTitulo("Pago con error — Ensambla.me");
	const { state } = useLocation();
	const { lineas, total: subtotal } = useCarrito();

	if (!lineas.length) {
		return (
			<main>
				<h1 className="h3 mb-3">Pago con error</h1>
				<EstadoVacio>
					<p className="mb-3">No hay ningun pago pendiente: tu carrito esta vacio.</p>
					<Link className="btn btn-primary" to="/productos">
						Ver el catalogo
					</Link>
				</EstadoVacio>
			</main>
		);
	}

	const entrega = state?.datos?.entrega;
	const envio = entrega ? costoEnvio(entrega, subtotal) : null;

	return (
		<main>
			<p className="sobretitulo">Compra no realizada</p>
			<h1 className="h3">Pago con error</h1>
			<Alerta tipo="danger">{state?.motivo ?? "No pudimos procesar tu pago."} No se realizo ningun cobro.</Alerta>
			<p className="text-secondary">Tu carrito sigue como estaba. Revisa los datos de la tarjeta o prueba con otra.</p>

			<div className="row g-4">
				<div className="col-12 col-lg-6">
					<ResumenPedido
						items={consolidar(lineas, buscarProducto)}
						subtotal={subtotal}
						envio={envio}
						total={subtotal + (envio ?? 0)}
					/>
				</div>
			</div>

			<div className="d-flex flex-wrap gap-2 my-4">
				<Link className="btn btn-primary" to="/checkout" state={state?.datos ? { datos: state.datos } : null}>
					Reintentar el pago
				</Link>
				<Link className="btn btn-outline-primary" to="/carrito">
					Volver al carrito
				</Link>
			</div>
		</main>
	);
}
