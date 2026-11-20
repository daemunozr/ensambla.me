// Experimento temporal (se borra): corre las pruebas de DatosProvider con el peor orden de temporizadores,
// en que el setTimeout(0) de Testing Library llega antes que el setImmediate de React.
const original = globalThis.setTimeout;
globalThis.setTimeout = (fn, ms, ...args) => {
	if (!ms) {
		queueMicrotask(() => fn(...args));
		return 0;
	}
	return original(fn, ms, ...args);
};

await import("./context/DatosProvider.test.jsx");
