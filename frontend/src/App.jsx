import { Route, Routes } from "react-router";
import RutaProtegida from "./components/RutaProtegida.jsx";
import { LayoutAdmin, LayoutTienda } from "./components/layout/Layouts.jsx";
import CarritoProvider from "./context/CarritoProvider.jsx";
import DatosProvider from "./context/DatosProvider.jsx";
import SesionProvider from "./context/SesionProvider.jsx";
import Armado from "./pages/Armado.jsx";
import Blog from "./pages/Blog.jsx";
import Blogs from "./pages/Blogs.jsx";
import Carrito from "./pages/Carrito.jsx";
import Categorias from "./pages/Categorias.jsx";
import Checkout from "./pages/Checkout.jsx";
import Contacto from "./pages/Contacto.jsx";
import Creditos from "./pages/Creditos.jsx";
import Inicio from "./pages/Inicio.jsx";
import Login from "./pages/Login.jsx";
import NoEncontrada from "./pages/NoEncontrada.jsx";
import MiCompra from "./pages/MiCompra.jsx";
import MisCompras from "./pages/MisCompras.jsx";
import Nosotros from "./pages/Nosotros.jsx";
import Ofertas from "./pages/Ofertas.jsx";
import PagoCorrecto from "./pages/PagoCorrecto.jsx";
import PagoError from "./pages/PagoError.jsx";
import Perfil from "./pages/Perfil.jsx";
import Producto from "./pages/Producto.jsx";
import Productos from "./pages/Productos.jsx";
import Registro from "./pages/Registro.jsx";
import CategoriasAdmin from "./pages/admin/Categorias.jsx";
import Criticos from "./pages/admin/Criticos.jsx";
import FormularioCategoria from "./pages/admin/FormularioCategoria.jsx";
import FormularioProducto from "./pages/admin/FormularioProducto.jsx";
import FormularioUsuario from "./pages/admin/FormularioUsuario.jsx";
import Orden from "./pages/admin/Orden.jsx";
import Ordenes from "./pages/admin/Ordenes.jsx";
import ProductosAdmin from "./pages/admin/Productos.jsx";
import Reportes from "./pages/admin/Reportes.jsx";
import Resumen from "./pages/admin/Resumen.jsx";
import Usuario from "./pages/admin/Usuario.jsx";
import Usuarios from "./pages/admin/Usuarios.jsx";

const SOLO_ADMIN = ["ADMIN"];
const ADMIN_Y_LOGISTICA = ["ADMIN", "LOGISTICA"];
const CON_SESION = ["ADMIN", "LOGISTICA", "CLIENTE"];

/** Envuelve una vista del panel con su control de acceso por rol (RNF-02). */
const protegida = (roles, vista) => <RutaProtegida roles={roles}>{vista}</RutaProtegida>;

export default function App() {
	return (
		<DatosProvider>
			<SesionProvider>
				<CarritoProvider>
					<Routes>
						{/* Vistas de tienda con la barra lateral de categorias (RNF-08 CA3). */}
						<Route element={<LayoutTienda conAside />}>
							<Route index element={<Inicio />} />
							<Route path="productos" element={<Productos />} />
							<Route path="productos/:sku" element={<Producto />} />
							<Route path="categorias" element={<Categorias />} />
							<Route path="ofertas" element={<Ofertas />} />
							<Route path="armado" element={<Armado />} />
							<Route path="carrito" element={<Carrito />} />
						</Route>

						<Route element={<LayoutTienda />}>
							<Route path="checkout" element={<Checkout />} />
							<Route path="pago/correcto/:numero" element={<PagoCorrecto />} />
							<Route path="pago/error" element={<PagoError />} />
							<Route path="perfil" element={protegida(CON_SESION, <Perfil />)} />
							<Route path="mis-compras" element={protegida(CON_SESION, <MisCompras />)} />
							<Route path="mis-compras/:numero" element={protegida(CON_SESION, <MiCompra />)} />
							<Route path="blogs" element={<Blogs />} />
							<Route path="blogs/:slug" element={<Blog />} />
							<Route path="nosotros" element={<Nosotros />} />
							<Route path="contacto" element={<Contacto />} />
							<Route path="registro" element={<Registro />} />
							<Route path="login" element={<Login />} />
							<Route path="creditos" element={<Creditos />} />
							<Route path="*" element={<NoEncontrada />} />
						</Route>

						<Route path="admin" element={<LayoutAdmin />}>
							<Route index element={protegida(SOLO_ADMIN, <Resumen />)} />
							<Route path="productos" element={protegida(ADMIN_Y_LOGISTICA, <ProductosAdmin />)} />
							<Route path="productos/nuevo" element={protegida(SOLO_ADMIN, <FormularioProducto />)} />
							<Route path="productos/criticos" element={protegida(ADMIN_Y_LOGISTICA, <Criticos />)} />
							<Route path="productos/:sku/editar" element={protegida(SOLO_ADMIN, <FormularioProducto />)} />
							<Route path="categorias" element={protegida(SOLO_ADMIN, <CategoriasAdmin />)} />
							<Route path="categorias/nueva" element={protegida(SOLO_ADMIN, <FormularioCategoria />)} />
							<Route path="categorias/:codigo/editar" element={protegida(SOLO_ADMIN, <FormularioCategoria />)} />
							<Route path="usuarios" element={protegida(SOLO_ADMIN, <Usuarios />)} />
							<Route path="usuarios/nuevo" element={protegida(SOLO_ADMIN, <FormularioUsuario />)} />
							<Route path="usuarios/:run" element={protegida(SOLO_ADMIN, <Usuario />)} />
							<Route path="usuarios/:run/editar" element={protegida(SOLO_ADMIN, <FormularioUsuario />)} />
							<Route path="ordenes" element={protegida(ADMIN_Y_LOGISTICA, <Ordenes />)} />
							<Route path="ordenes/:numero" element={protegida(ADMIN_Y_LOGISTICA, <Orden />)} />
							<Route path="reportes" element={protegida(SOLO_ADMIN, <Reportes />)} />
							<Route path="perfil" element={protegida(ADMIN_Y_LOGISTICA, <Perfil enPanel />)} />
						</Route>
					</Routes>
				</CarritoProvider>
			</SesionProvider>
		</DatosProvider>
	);
}
