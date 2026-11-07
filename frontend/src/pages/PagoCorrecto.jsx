import { Link, useParams } from "react-router";
import Alerta from "../components/Alerta.jsx";
import Boleta from "../components/Boleta.jsx";
import EstadoVacio from "../components/EstadoVacio.jsx";
import { useSesion } from "../context/sesion.js";
import { itemsDeOrden, orden as buscarOrden } from "../data/datos.js";
import { useTitulo } from "../hooks/useTitulo.js";
import { puedeVerOrden } from "../logic/ordenes.js";

/** Confirmacion de una compra pagada, con la boleta como resumen del pedido. */
export default function PagoCorrecto() {
	const { numero = "" } = useParams();
	const { sesion } = useSesion();
	const orden = buscarOrden(numero);
	const visible = puedeVerOrden(orden, sesion);
	useTitulo(visible ? "Pago correcto — Ensambla.me" : "Orden no encontrada — Ensambla.me");

	// Una orden que no existe, o que es de otra cuenta, se trata igual: no se revela cual.
	if (!visible) {
		return (
			<main>
				<h1 className="h3 mb-3">Orden no encontrada</h1>
				<EstadoVacio>
					<p>
						No hay una orden con el numero <strong>{numero || "(sin numero)"}</strong> que puedas ver.
					</p>
					<Link className="btn btn-primary" to="/productos">
						Ver el catalogo
					</Link>
				</EstadoVacio>
			</main>
		);
	}

	return (
		<main>
			<p className="sobretitulo">Compra realizada</p>
			<h1 className="h3">Pago correcto</h1>
			<Alerta>
				Gracias por tu compra, {orden.nombre}. Tu orden <strong>{orden.numero}</strong> quedo registrada: guarda
				su numero para consultarla.
			</Alerta>

			<Boleta orden={orden} items={itemsDeOrden(orden.numero)} />

			<div className="d-flex flex-wrap gap-2 mb-4">
				<Link className="btn btn-primary" to="/productos">
					Seguir comprando
				</Link>
				{sesion && orden.cliente === sesion.run && (
					<Link className="btn btn-outline-primary" to="/mis-compras">
						Ver mis compras
					</Link>
				)}
				<Link className="btn btn-outline-primary" to="/">
					Volver al inicio
				</Link>
			</div>
		</main>
	);
}
