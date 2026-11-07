import { Link, useParams } from "react-router";
import Boleta from "../components/Boleta.jsx";
import EstadoVacio from "../components/EstadoVacio.jsx";
import { useSesion } from "../context/sesion.js";
import { itemsDeOrden, orden as buscarOrden } from "../data/datos.js";
import { useTitulo } from "../hooks/useTitulo.js";

/** Boleta de una compra propia. Una orden de otra cuenta, o de un invitado, no se muestra. */
export default function MiCompra() {
	const { numero = "" } = useParams();
	const { sesion } = useSesion();
	const orden = buscarOrden(numero);
	const propia = Boolean(orden && sesion && orden.cliente === sesion.run);
	useTitulo(propia ? `Compra ${orden.numero} — Ensambla.me` : "Orden no encontrada — Ensambla.me");

	if (!propia) {
		return (
			<main>
				<h1 className="h3 mb-3">Orden no encontrada</h1>
				<EstadoVacio>
					<p>
						No hay una compra con el numero <strong>{numero || "(sin numero)"}</strong> en tu cuenta.
					</p>
					<Link className="btn btn-primary" to="/mis-compras">
						Ver mis compras
					</Link>
				</EstadoVacio>
			</main>
		);
	}

	return (
		<main>
			<p className="sobretitulo">Mi cuenta</p>
			<h1 className="h3 mb-4">Compra {orden.numero}</h1>

			<Boleta orden={orden} items={itemsDeOrden(orden.numero)} />

			<p>
				<Link className="btn btn-outline-primary no-imprimir" to="/mis-compras">
					Volver a mis compras
				</Link>
			</p>
		</main>
	);
}
