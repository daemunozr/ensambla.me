/** Mensaje en lugar de un area en blanco cuando no hay nada que mostrar (RF-03 CA3). */
export default function EstadoVacio({ children }) {
	return <div className="estado-vacio">{children}</div>;
}
