import { Link } from "react-router";
import Indicador from "../../components/Indicador.jsx";
import { useDatos } from "../../context/datos.js";
import { roles, totalOrden } from "../../data/datos.js";
import { useTitulo } from "../../hooks/useTitulo.js";
import { enStockCritico } from "../../logic/stock.js";
import { precio } from "../../utils/formato.js";

const ACCESOS = [
	{
		titulo: "Mantenedor de Productos",
		texto: "Listar, crear y editar los productos del catalogo, con alerta de bajo inventario.",
		ruta: "/admin/productos",
		boton: "Abrir productos",
	},
	{
		titulo: "Productos criticos",
		texto: "Productos con stock bajo o igual a su umbral, del mas urgente al menos.",
		ruta: "/admin/productos/criticos",
		boton: "Ver criticos",
	},
	{
		titulo: "Mantenedor de Categorias",
		texto: "Crear, renombrar y eliminar las categorias del catalogo.",
		ruta: "/admin/categorias",
		boton: "Abrir categorias",
	},
	{
		titulo: "Mantenedor de Usuarios",
		texto: "Listar, crear y editar usuarios, y asignarles su tipo de usuario.",
		ruta: "/admin/usuarios",
		boton: "Abrir usuarios",
	},
	{
		titulo: "Ordenes",
		texto: "Consultar las ordenes de compra y su boleta en modo de solo lectura.",
		ruta: "/admin/ordenes",
		boton: "Abrir ordenes",
	},
	{
		titulo: "Reportes",
		texto: "Ventas por mes, categoria, producto y cliente, mas el inventario valorizado.",
		ruta: "/admin/reportes",
		boton: "Abrir reportes",
	},
];

/** Home del panel: estado de los datos y accesos a los mantenedores (RNF-08 CA5). */
export default function Resumen() {
	useTitulo("Panel — Ensambla.me");
	const { productos, usuarios, categorias, ordenes } = useDatos();
	const vendido = ordenes.reduce((total, orden) => total + totalOrden(orden.numero), 0);

	const indicadores = [
		{ titulo: "Productos en catalogo", valor: productos.length, nota: `${categorias.length} categorias` },
		{ titulo: "En stock critico", valor: productos.filter(enStockCritico).length, nota: "Requieren reposicion" },
		{ titulo: "Usuarios registrados", valor: usuarios.length, nota: `${roles.length} roles` },
		{ titulo: "Ordenes", valor: ordenes.length, nota: `${precio(vendido)} en total` },
	];

	return (
		<main className="col-12 col-lg-9">
			<p className="sobretitulo">Administracion</p>
			<h1 className="h3">Resumen del sistema</h1>
			<p className="text-secondary mb-4">
				Estado de los datos cargados en esta sesion del navegador. Los mantenedores estan en el menu de la
				izquierda.
			</p>

			<div className="row row-cols-1 row-cols-sm-2 row-cols-xl-4 g-3 mb-4">
				{indicadores.map((indicador) => (
					<Indicador key={indicador.titulo} {...indicador} />
				))}
			</div>

			<div className="row row-cols-1 row-cols-md-2 row-cols-xl-4 g-3">
				{ACCESOS.map((acceso) => (
					<div className="col" key={acceso.ruta}>
						<article className="card h-100">
							<div className="card-body d-flex flex-column">
								<h2 className="h6 card-title">{acceso.titulo}</h2>
								<p className="card-text small">{acceso.texto}</p>
								<Link className="btn btn-sm btn-outline-primary mt-auto align-self-start" to={acceso.ruta}>
									{acceso.boton}
								</Link>
							</div>
						</article>
					</div>
				))}
			</div>
		</main>
	);
}
