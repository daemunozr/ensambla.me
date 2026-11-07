import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router";
import { useCarrito } from "../../context/carrito.js";
import { recurso } from "../../utils/recursos.js";

const ENLACES = [
	{ ruta: "/", texto: "Inicio" },
	{ ruta: "/productos", texto: "Productos" },
	{ ruta: "/categorias", texto: "Categorias" },
	{ ruta: "/ofertas", texto: "Ofertas" },
	{ ruta: "/armado", texto: "Armar mi PC" },
	{ ruta: "/blogs", texto: "Blogs" },
	{ ruta: "/nosotros", texto: "Nosotros" },
	{ ruta: "/contacto", texto: "Contacto" },
];

/** Menu principal: logo, vistas publicas, busqueda y acceso al carrito con su contador (RF-14). */
export default function Nav() {
	const { cantidad } = useCarrito();
	const navegar = useNavigate();
	const [abierto, setAbierto] = useState(false);
	const cerrar = () => setAbierto(false);

	/** La busqueda del menu lleva al catalogo con el texto como filtro (?q=). */
	const buscar = (evento) => {
		evento.preventDefault();
		const texto = String(new FormData(evento.currentTarget).get("q") ?? "").trim();
		navegar(texto ? `/productos?q=${encodeURIComponent(texto)}` : "/productos");
		cerrar();
	};

	return (
		<nav className="navbar navbar-expand-xl navbar-principal" aria-label="Navegacion principal">
			<div className="container">
				<Link className="navbar-brand d-flex align-items-center gap-2" to="/" onClick={cerrar}>
					<img src={recurso("resources/img/logo.svg")} alt="" className="logo-marca" width="36" height="36" />
					Ensambla<span className="punto">.me</span>
				</Link>

				<button
					className="navbar-toggler"
					type="button"
					aria-controls="menuPrincipal"
					aria-expanded={abierto}
					aria-label="Abrir el menu de navegacion"
					onClick={() => setAbierto((valor) => !valor)}
				>
					<span className="navbar-toggler-icon"></span>
				</button>

				<div className={`collapse navbar-collapse${abierto ? " show" : ""}`} id="menuPrincipal">
					<ul className="navbar-nav me-auto mb-2 mb-xl-0">
						{ENLACES.map((enlace) => (
							<li className="nav-item" key={enlace.ruta}>
								<NavLink className="nav-link" to={enlace.ruta} end={enlace.ruta === "/"} onClick={cerrar}>
									{enlace.texto}
								</NavLink>
							</li>
						))}
					</ul>

					<form className="d-flex gap-2 me-xl-3 mb-2 mb-xl-0" role="search" onSubmit={buscar}>
						<label className="visually-hidden" htmlFor="busqueda-menu">
							Buscar productos
						</label>
						<input
							id="busqueda-menu"
							name="q"
							type="search"
							className="form-control form-control-sm campo-busqueda"
							placeholder="Buscar productos"
							maxLength={100}
							autoComplete="off"
						/>
						<button type="submit" className="btn btn-sm btn-outline-primary">
							Buscar
						</button>
					</form>

					<Link to="/carrito" className="btn btn-outline-primary position-relative boton-carrito" onClick={cerrar}>
						Carrito
						<span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
							{cantidad}
							<span className="visually-hidden"> productos en el carrito</span>
						</span>
					</Link>
				</div>
			</div>
		</nav>
	);
}
