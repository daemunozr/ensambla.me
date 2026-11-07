import { Link } from "react-router";

/** Pie de pagina informativo: nombre, navegacion, contacto y ano (RNF-08 CA4). */
export default function Footer() {
	return (
		<footer className="pie-sitio py-4">
			<div className="container">
				<div className="row g-4">
					<div className="col-12 col-md-4">
						<h2>Ensambla.me</h2>
						<p className="small mb-0">
							Tienda online de componentes y asistente de armado de PC gamer. Escoge pieza por pieza o
							llevate el equipo completo.
						</p>
					</div>

					<nav className="col-6 col-md-3" aria-label="Enlaces de la tienda">
						<h2>Tienda</h2>
						<ul className="list-unstyled small mb-0">
							<li><Link to="/productos">Productos</Link></li>
							<li><Link to="/categorias">Categorias</Link></li>
							<li><Link to="/ofertas">Ofertas</Link></li>
							<li><Link to="/armado">Armar mi PC</Link></li>
							<li><Link to="/carrito">Carrito</Link></li>
							<li><Link to="/blogs">Blogs</Link></li>
						</ul>
					</nav>

					<nav className="col-6 col-md-2" aria-label="Enlaces de la empresa">
						<h2>Empresa</h2>
						<ul className="list-unstyled small mb-0">
							<li><Link to="/nosotros">Nosotros</Link></li>
							<li><Link to="/contacto">Contacto</Link></li>
							<li><Link to="/login">Iniciar sesion</Link></li>
						</ul>
					</nav>

					<div className="col-12 col-md-3">
						<h2>Contacto</h2>
						<address className="small mb-0">
							Av. Vicuna Mackenna 4860, Macul, Santiago
							<br />
							+56 2 2345 6789
							<br />
							<a href="mailto:contacto@ensambla.me">contacto@ensambla.me</a>
						</address>
					</div>
				</div>

				<hr className="border-secondary" />

				<p className="small text-center mb-0">
					&copy; {new Date().getFullYear()} Ensambla.me &middot; Proyecto academico Duoc UC, Desarrollo
					Fullstack II (DSY1104).
				</p>
				<p className="small text-center mb-0">
					Imagenes de productos: <Link to="/creditos">ver creditos</Link>.
				</p>
			</div>
		</footer>
	);
}
