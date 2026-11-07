/*
 * Busqueda de texto libre que ignora mayusculas y tildes. La usan el catalogo
 * de la tienda y los listados del panel.
 */

/** Minusculas, sin tildes ni espacios sobrantes: "Tarjeta GRÁFICA " -> "tarjeta grafica". */
export const normalizarTexto = (valor) =>
	String(valor ?? "")
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.toLowerCase()
		.trim();

/**
 * Cada palabra de la busqueda debe aparecer en alguno de los campos. Una
 * busqueda vacia coincide con todo.
 */
export function coincide(busqueda, ...campos) {
	const palabras = normalizarTexto(busqueda).split(/\s+/).filter(Boolean);
	if (!palabras.length) return true;

	const texto = normalizarTexto(campos.join(" "));
	return palabras.every((palabra) => texto.includes(palabra));
}
