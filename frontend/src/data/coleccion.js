/*
 * Coleccion de registros persistida en sessionStorage (base de datos simulada).
 *
 * Cada coleccion es una copia de trabajo sembrada desde data/semillas.js: se
 * lee del almacenamiento en cada consulta y se escribe completa en cada
 * cambio. Cerrar el navegador la descarta y la proxima lectura vuelve a la
 * semilla. Las reglas de negocio (unicidad, integridad) viven en data/datos.js.
 *
 * "id" es el campo que identifica a cada registro o, si la clave es compuesta,
 * una funcion que la calcula a partir del registro.
 */
export function crearColeccion({ clave, semilla, id }) {
	const identificador = typeof id === "function" ? id : (registro) => registro[id];

	function listar() {
		try {
			const guardado = window.sessionStorage.getItem(clave);
			if (guardado) {
				const lista = JSON.parse(guardado);
				if (Array.isArray(lista)) return lista;
			}
		} catch (error) {
			console.error(`datos: contenido invalido en "${clave}", se vuelve a los datos de prueba`, error);
		}
		return structuredClone(semilla);
	}

	function guardar(lista) {
		try {
			window.sessionStorage.setItem(clave, JSON.stringify(lista));
		} catch (error) {
			console.error(`datos: no se pudo guardar "${clave}"`, error);
		}
		return lista;
	}

	const obtener = (valor) => listar().find((registro) => identificador(registro) === valor);

	return {
		listar,
		obtener,
		existe: (valor) => Boolean(obtener(valor)),
		insertar: (registro) => guardar([...listar(), registro]),
		insertarVarios: (registros) => guardar([...listar(), ...registros]),
		reemplazar: (valor, registro) =>
			guardar(listar().map((actual) => (identificador(actual) === valor ? registro : actual))),
		quitar: (valor) => guardar(listar().filter((registro) => identificador(registro) !== valor)),
	};
}
