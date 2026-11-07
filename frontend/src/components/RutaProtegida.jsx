import { Link, Navigate, useLocation } from "react-router";
import Alerta from "./Alerta.jsx";
import { inicioDeRol, useSesion } from "../context/sesion.js";
import { nombreRol } from "../data/datos.js";

/**
 * Exige sesion y rol para ver una vista (RNF-02 CA1 y CA6).
 * Sin sesion redirige al inicio de sesion recordando el destino; con un rol
 * que no corresponde muestra un aviso y no renderiza la vista.
 */
export default function RutaProtegida({ roles, children }) {
	const { sesion } = useSesion();
	const ubicacion = useLocation();

	if (!sesion) {
		const destino = encodeURIComponent(ubicacion.pathname + ubicacion.search);
		return <Navigate to={`/login?destino=${destino}`} replace />;
	}

	if (!roles.includes(sesion.rol)) {
		return (
			<main className="col-12 col-lg-9">
				<h1 className="h3 mb-3">Acceso denegado</h1>
				<Alerta tipo="danger">Tu rol ({nombreRol(sesion.rol)}) no tiene permiso para ver esta seccion.</Alerta>
				<p>
					<Link className="btn btn-outline-primary" to={inicioDeRol(sesion.rol)}>
						Ir a donde si tienes acceso
					</Link>
				</p>
			</main>
		);
	}

	return children;
}
