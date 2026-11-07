import { Outlet } from "react-router";
import Aside from "./Aside.jsx";
import AsideAdmin from "./AsideAdmin.jsx";
import Footer from "./Footer.jsx";
import Header from "./Header.jsx";
import Nav from "./Nav.jsx";

/** Vistas publicas: encabezado, menu, contenido (con o sin categorias) y pie. */
export function LayoutTienda({ conAside = false }) {
	return (
		<>
			<Header />
			<Nav />
			<div className="container my-4">
				{conAside ? (
					<div className="row g-4">
						<Aside />
						<Outlet />
					</div>
				) : (
					<Outlet />
				)}
			</div>
			<Footer />
		</>
	);
}

/** Panel de administracion: encabezado, menu vertical por rol, contenido y pie. */
export function LayoutAdmin() {
	return (
		<>
			<Header />
			<div className="container my-4">
				<div className="row g-4">
					<AsideAdmin />
					<Outlet />
				</div>
			</div>
			<Footer />
		</>
	);
}
