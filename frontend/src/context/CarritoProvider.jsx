/*
 * Proveedor del carrito de compras (RF-05, RF-06, RF-14 CA2). La lectura y
 * escritura en localStorage y el hook useCarrito viven en context/carrito.js;
 * las reglas, en logic/carrito.js.
 */
import { useCallback, useMemo, useRef, useState } from "react";
import Toasts from "../components/Toasts.jsx";
import * as reglas from "../logic/carrito.js";
import { CarritoContext, guardarCarrito, leerCarrito } from "./carrito.js";
import { useDatos } from "./datos.js";

export default function CarritoProvider({ children }) {
	const [guardadas, setLineas] = useState(leerCarrito);
	const { productos } = useDatos();

	/*
	 * Las lineas se ajustan al catalogo vigente cada vez que este cambia: si un
	 * producto se elimina o baja su stock desde el panel, el carrito lo refleja
	 * al instante (RF-06 CA4), sin esperar a la proxima operacion.
	 */
	const lineas = useMemo(
		() => reglas.normalizar(guardadas, (sku) => productos.find((p) => p.sku === sku)),
		[guardadas, productos],
	);
	const [avisos, setAvisos] = useState([]);
	const siguienteAviso = useRef(1);

	/** Confirmacion visual de cada operacion (RF-05 CA3); se cierra sola a los 3 s. */
	const avisar = useCallback((texto) => {
		if (!texto) return;
		const id = siguienteAviso.current++;
		setAvisos((actuales) => [...actuales, { id, texto }]);
		window.setTimeout(() => setAvisos((actuales) => actuales.filter((aviso) => aviso.id !== id)), 3000);
	}, []);

	const cerrarAviso = useCallback((id) => setAvisos((actuales) => actuales.filter((aviso) => aviso.id !== id)), []);

	/**
	 * Aplica una operacion sobre el carrito vigente: se relee y normaliza antes,
	 * porque el stock pudo cambiar desde el mantenedor de productos.
	 */
	const aplicar = useCallback(
		(operacion) => {
			const resultado = operacion(leerCarrito());
			const nuevas = resultado.lineas ?? resultado;
			if (resultado.ok !== false) guardarCarrito(nuevas);
			setLineas(resultado.ok === false ? leerCarrito() : nuevas);
			avisar(resultado.mensaje);
			return resultado.ok !== false;
		},
		[avisar],
	);

	const valor = useMemo(
		() => ({
			lineas,
			cantidad: reglas.cantidadItems(lineas),
			total: reglas.total(lineas),
			agregar: (sku, cantidad = 1) => aplicar((actuales) => reglas.agregarProducto(actuales, sku, cantidad)),
			agregarArmado: (skus) =>
				aplicar((actuales) =>
					reglas.agregarArmado(actuales, skus, `ARM-${Date.now().toString(36).toUpperCase()}`),
				),
			cambiarCantidad: (numero, cantidad) =>
				aplicar((actuales) => reglas.cambiarCantidad(actuales, numero, cantidad)),
			eliminarLinea: (numero) => aplicar((actuales) => reglas.eliminarLinea(actuales, numero)),
			eliminarArmado: (agrupador) => aplicar((actuales) => reglas.eliminarArmado(actuales, agrupador)),
			vaciar: () => aplicar(() => reglas.vaciar()),
		}),
		[lineas, aplicar],
	);

	return (
		<CarritoContext.Provider value={valor}>
			{children}
			<Toasts avisos={avisos} onCerrar={cerrarAviso} />
		</CarritoContext.Provider>
	);
}
