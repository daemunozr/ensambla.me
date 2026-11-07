import { useCallback, useState } from "react";
import { Link, useSearchParams } from "react-router";
import Alerta, { ZonaAviso } from "../../components/Alerta.jsx";
import CajaBusqueda from "../../components/CajaBusqueda.jsx";
import EstadoVacio from "../../components/EstadoVacio.jsx";
import ModalConfirmacion from "../../components/ModalConfirmacion.jsx";
import { useDatos } from "../../context/datos.js";
import { useSesion } from "../../context/sesion.js";
import { nombreComuna, nombreRegionDeComuna, nombreRol } from "../../data/datos.js";
import { useEliminacion } from "../../hooks/useEliminacion.js";
import { useTitulo } from "../../hooks/useTitulo.js";
import { coincide } from "../../logic/busqueda.js";

/** Listado de usuarios con acceso a crear, editar y eliminar (RF-11). */
export default function Usuarios() {
	useTitulo("Usuarios — Panel Ensambla.me");
	const { sesion } = useSesion();
	const { usuarios, eliminarUsuario } = useDatos();
	const [parametros] = useSearchParams();
	const guardado = parametros.get("guardado");
	const [busqueda, setBusqueda] = useState("");
	const visibles = usuarios.filter((u) =>
		coincide(busqueda, u.run, u.nombre, u.apellidos, u.correo, nombreRol(u.tipoUsuario), nombreComuna(u.comuna)),
	);

	// La capa de datos rechaza la propia cuenta y a los usuarios con ordenes.
	const eliminacion = useEliminacion(
		useCallback((usuario) => eliminarUsuario(usuario.run, sesion?.run), [eliminarUsuario, sesion]),
	);

	return (
		<main className="col-12 col-lg-9">
			<div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3">
				<div>
					<p className="sobretitulo">Mantenedor</p>
					<h1 className="h3 mb-0">Usuarios</h1>
				</div>
				<Link className="btn btn-primary" to="/admin/usuarios/nuevo">
					Nuevo usuario
				</Link>
			</div>

			{eliminacion.aviso ? (
				<ZonaAviso aviso={eliminacion.aviso} />
			) : (
				<div aria-live="polite">
					{guardado && (
						<Alerta>
							El usuario con RUN <strong>{guardado}</strong> se guardo correctamente.
						</Alerta>
					)}
				</div>
			)}

			<CajaBusqueda
				id="busqueda-usuarios"
				placeholder="RUN, nombre, correo, tipo o comuna"
				valor={busqueda}
				onCambio={setBusqueda}
				mostrados={visibles.length}
				total={usuarios.length}
			/>

			<div className="table-responsive">
				{visibles.length ? (
					<table className="table table-hover tabla-admin align-middle">
						<caption className="visually-hidden">Listado de usuarios del sistema</caption>
						<thead>
							<tr>
								<th scope="col">RUN</th>
								<th scope="col">Nombre</th>
								<th scope="col">Correo</th>
								<th scope="col">Tipo de usuario</th>
								<th scope="col">Comuna</th>
								<th scope="col" className="text-end">Acciones</th>
							</tr>
						</thead>
						<tbody>
							{visibles.map((usuario) => {
								const propia = usuario.run === sesion?.run;
								return (
									<tr key={usuario.run}>
										<td>
											<code>{usuario.run}</code>
										</td>
										<td>
											{usuario.nombre} {usuario.apellidos}
											{propia && <span className="d-block small text-secondary">Tu cuenta</span>}
										</td>
										<td>{usuario.correo}</td>
										<td>{nombreRol(usuario.tipoUsuario)}</td>
										<td>
											{nombreComuna(usuario.comuna)}, {nombreRegionDeComuna(usuario.comuna)}
										</td>
										<td className="text-end text-nowrap">
											<Link
												className="btn btn-sm btn-outline-secondary"
												to={`/admin/usuarios/${encodeURIComponent(usuario.run)}`}
											>
												Ver
											</Link>{" "}
											<Link
												className="btn btn-sm btn-outline-primary"
												to={`/admin/usuarios/${encodeURIComponent(usuario.run)}/editar`}
											>
												Editar
											</Link>{" "}
											<button
												type="button"
												className="btn btn-sm btn-outline-danger"
												disabled={propia}
												title={propia ? "No puedes eliminar tu propia cuenta" : undefined}
												onClick={() => eliminacion.pedir(usuario)}
											>
												Eliminar
											</button>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				) : (
					<EstadoVacio>
						<p className="mb-0">
							{usuarios.length ? "Ningun usuario coincide con la busqueda." : "No hay usuarios cargados."}
						</p>
					</EstadoVacio>
				)}
			</div>

			<ModalConfirmacion
				abierto={Boolean(eliminacion.pendiente)}
				titulo="Eliminar usuario"
				onConfirmar={eliminacion.confirmar}
				onCancelar={eliminacion.cancelar}
			>
				<p>
					Se eliminara la cuenta de{" "}
					<strong>
						{eliminacion.pendiente?.nombre} {eliminacion.pendiente?.apellidos}
					</strong>{" "}
					(RUN {eliminacion.pendiente?.run}) y ya no podra iniciar sesion.
				</p>
				<p className="mb-0">Esta accion no se puede deshacer.</p>
			</ModalConfirmacion>
		</main>
	);
}
