import { Link, useParams } from "react-router";
import EstadoVacio from "../../components/EstadoVacio.jsx";
import TablaOrdenes from "../../components/TablaOrdenes.jsx";
import { useDatos } from "../../context/datos.js";
import { nombreComuna, nombreRegionDeComuna, nombreRol, totalOrden } from "../../data/datos.js";
import { useTitulo } from "../../hooks/useTitulo.js";
import { fecha, precio } from "../../utils/formato.js";

/** Ficha de un usuario (sin su contrasena) y su historial de compras. */
export default function Usuario() {
	const { run = "" } = useParams();
	const { usuarios, ordenes } = useDatos();
	const usuario = usuarios.find((u) => u.run === run);
	useTitulo(usuario ? `${usuario.nombre} ${usuario.apellidos} — Panel Ensambla.me` : "Usuario no encontrado — Panel Ensambla.me");

	if (!usuario) {
		return (
			<main className="col-12 col-lg-9">
				<h1 className="h3">Usuario no encontrado</h1>
				<EstadoVacio>
					<p>
						No existe un usuario con RUN <strong>{run || "(sin RUN)"}</strong>.
					</p>
					<Link className="btn btn-primary" to="/admin/usuarios">
						Volver a los usuarios
					</Link>
				</EstadoVacio>
			</main>
		);
	}

	const compras = ordenes.filter((orden) => orden.cliente === usuario.run);
	const gastado = compras.reduce((total, orden) => total + totalOrden(orden.numero), 0);

	return (
		<main className="col-12 col-lg-9">
			<div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3">
				<div>
					<p className="sobretitulo">Mantenedor de usuarios</p>
					<h1 className="h3 mb-0">
						{usuario.nombre} {usuario.apellidos}
					</h1>
				</div>
				<div className="d-flex flex-wrap gap-2">
					<Link className="btn btn-primary" to={`/admin/usuarios/${encodeURIComponent(usuario.run)}/editar`}>
						Editar usuario
					</Link>
					<Link className="btn btn-outline-primary" to="/admin/usuarios">
						Volver al listado
					</Link>
				</div>
			</div>

			<section className="tarjeta-formulario p-4 mb-4" aria-labelledby="usuario-datos">
				<h2 className="h5 mb-3" id="usuario-datos">
					Datos del usuario
				</h2>
				<dl className="row small mb-0">
					<dt className="col-5 col-md-3">RUN</dt>
					<dd className="col-7 col-md-9">{usuario.run}</dd>
					<dt className="col-5 col-md-3">Correo</dt>
					<dd className="col-7 col-md-9">{usuario.correo}</dd>
					<dt className="col-5 col-md-3">Tipo de usuario</dt>
					<dd className="col-7 col-md-9">{nombreRol(usuario.tipoUsuario)}</dd>
					<dt className="col-5 col-md-3">Nacimiento</dt>
					<dd className="col-7 col-md-9">{fecha(usuario.fechaNacimiento) || "—"}</dd>
					<dt className="col-5 col-md-3">Direccion</dt>
					<dd className="col-7 col-md-9">
						{usuario.direccion}, {nombreComuna(usuario.comuna)}, {nombreRegionDeComuna(usuario.comuna)}
					</dd>
				</dl>
			</section>

			<section aria-labelledby="usuario-compras">
				<h2 className="h5" id="usuario-compras">
					Historial de compras
				</h2>
				<p className="text-secondary">
					{compras.length
						? `${compras.length} ${compras.length === 1 ? "compra" : "compras"} por un total de ${precio(gastado)}.`
						: "Este usuario todavia no tiene compras."}
				</p>
				{compras.length > 0 && (
					<TablaOrdenes
						ordenes={compras}
						rutaDetalle={(numero) => `/admin/ordenes/${encodeURIComponent(numero)}`}
						titulo={`Compras de ${usuario.nombre} ${usuario.apellidos}`}
					/>
				)}
			</section>
		</main>
	);
}
