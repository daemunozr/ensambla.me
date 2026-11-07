import { Link, useLocation } from "react-router";
import { useSesion } from "../../context/sesion.js";

const ADMIN_Y_LOGISTICA = ["ADMIN", "LOGISTICA"];

/*
 * Opciones del panel por rol. "exacta" marca solo la ruta exacta (el resto de
 * las rutas del panel cuelgan de /admin) y "excluir" evita que una opcion se
 * marque en una subruta que tiene su propia opcion.
 */
const OPCIONES_PANEL = [
	{ texto: "Resumen", ruta: "/admin", roles: ["ADMIN"], exacta: true },
	{ texto: "Productos", ruta: "/admin/productos", roles: ADMIN_Y_LOGISTICA, excluir: "/admin/productos/criticos" },
	{ texto: "Criticos", ruta: "/admin/productos/criticos", roles: ADMIN_Y_LOGISTICA },
	{ texto: "Categorias", ruta: "/admin/categorias", roles: ["ADMIN"] },
	{ texto: "Usuarios", ruta: "/admin/usuarios", roles: ["ADMIN"] },
	{ texto: "Ordenes", ruta: "/admin/ordenes", roles: ADMIN_Y_LOGISTICA },
	{ texto: "Reportes", ruta: "/admin/reportes", roles: ["ADMIN"] },
	{ texto: "Mi perfil", ruta: "/admin/perfil", roles: ADMIN_Y_LOGISTICA },
];

const dentroDe = (pathname, ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`);

/**
 * Menu vertical del panel. Solo se renderizan las opciones del rol: las demas
 * no existen en el DOM, no basta con ocultarlas (RNF-02 CA2).
 */
export default function AsideAdmin() {
	const { sesion } = useSesion();
	const { pathname } = useLocation();
	const opciones = OPCIONES_PANEL.filter((opcion) => sesion && opcion.roles.includes(sesion.rol));

	const estaActiva = (opcion) => {
		if (opcion.exacta) return pathname === opcion.ruta;
		return dentroDe(pathname, opcion.ruta) && !(opcion.excluir && dentroDe(pathname, opcion.excluir));
	};

	return (
		<aside className="col-12 col-lg-3">
			<p className="sobretitulo mb-2">Panel</p>
			<nav className="menu-admin nav flex-column" aria-label="Menu del panel de administracion">
				{opciones.map((opcion) => {
					const activa = estaActiva(opcion);
					return (
						<Link
							key={opcion.ruta}
							to={opcion.ruta}
							className={`nav-link${activa ? " activo" : ""}`}
							aria-current={activa ? "page" : undefined}
						>
							{opcion.texto}
						</Link>
					);
				})}
			</nav>
			<p className="small mt-3 mb-0">
				<Link to="/">Volver a la tienda</Link>
			</p>
		</aside>
	);
}
