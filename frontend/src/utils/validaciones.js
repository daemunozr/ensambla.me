/*
 * Reglas de validacion de formularios (RF-01, RF-08, RF-10, RF-11, RNF-02).
 *
 * Cada regla recibe el valor del campo y devuelve "" si pasa o el mensaje de
 * error. La sugerencia del formato esperado se muestra aparte, como form-text,
 * y es distinta del mensaje de error (RNF-02 CA5).
 */

// Unicos dominios de correo aceptados por el sistema.
export const DOMINIOS_PERMITIDOS = ["@duoc.cl", "@profesor.duoc.cl", "@gmail.com"];

/* ------------------------------------------------------------------- RUN */
/** Digito verificador de un RUN chileno por el metodo del modulo 11. */
export function digitoVerificador(cuerpo) {
	let suma = 0;
	let factor = 2;

	for (const caracter of [...String(cuerpo)].reverse()) {
		suma += Number(caracter) * factor;
		factor = factor === 7 ? 2 : factor + 1;
	}

	const resto = 11 - (suma % 11);
	if (resto === 11) return "0";
	if (resto === 10) return "K";
	return String(resto);
}

/** Valida un RUN sin puntos ni guion, de 7 a 9 caracteres (RF-01 CA2). */
export function runValido(valor) {
	const run = String(valor).trim().toUpperCase();
	if (!/^[0-9]{6,8}[0-9K]$/.test(run)) return false;
	return digitoVerificador(run.slice(0, -1)) === run.slice(-1);
}

/* --------------------------------------------------------------- Tarjeta */
/** Algoritmo de Luhn: el digito de control de los numeros de tarjeta. */
export function luhnValido(numero) {
	const digitos = String(numero).replace(/\D/g, "");
	if (!digitos) return false;

	let suma = 0;
	[...digitos].reverse().forEach((digito, i) => {
		let valor = Number(digito);
		if (i % 2 === 1) {
			valor *= 2;
			if (valor > 9) valor -= 9;
		}
		suma += valor;
	});
	return suma % 10 === 0;
}

/* ---------------------------------------------------------------- Reglas */
export const reglas = {
	requerido: (mensaje = "Este campo es obligatorio.") => (valor) =>
		String(valor ?? "").trim() === "" ? mensaje : "",

	maximo: (largo) => (valor) =>
		String(valor ?? "").length > largo ? `No puede superar los ${largo} caracteres.` : "",

	minimo: (largo) => (valor) => {
		const texto = String(valor ?? "").trim();
		return texto !== "" && texto.length < largo ? `Debe tener al menos ${largo} caracteres.` : "";
	},

	run: () => (valor) =>
		String(valor ?? "").trim() === "" || runValido(valor)
			? ""
			: "RUN invalido: escribelo sin puntos ni guion y revisa el digito verificador.",

	correo: () => (valor) => {
		const correo = String(valor ?? "").trim().toLowerCase();
		if (correo === "") return "";
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return "Escribe un correo valido.";
		return DOMINIOS_PERMITIDOS.some((dominio) => correo.endsWith(dominio))
			? ""
			: `Solo se aceptan los dominios ${DOMINIOS_PERMITIDOS.join(", ")}.`;
	},

	contrasena: () => (valor) => {
		const clave = String(valor ?? "");
		if (clave === "") return "";
		return clave.length < 4 || clave.length > 10 ? "La contrasena debe tener entre 4 y 10 caracteres." : "";
	},

	numeroMinimo: (minimo) => (valor) => {
		if (String(valor ?? "").trim() === "") return "";
		const numero = Number(valor);
		if (Number.isNaN(numero)) return "Debe ser un numero.";
		return numero < minimo ? `No puede ser menor que ${minimo}.` : "";
	},

	/** Numero de tarjeta: de 13 a 19 digitos (se admiten espacios) con digito de control valido. */
	tarjeta: () => (valor) => {
		const texto = String(valor ?? "").trim();
		if (texto === "") return "";
		if (!/^[\d ]+$/.test(texto)) return "Escribe solo numeros, sin guiones ni letras.";
		const digitos = texto.replace(/ /g, "");
		if (digitos.length < 13 || digitos.length > 19) return "El numero debe tener entre 13 y 19 digitos.";
		return luhnValido(digitos) ? "" : "El numero de la tarjeta no es valido: revisa los digitos.";
	},

	/** Vencimiento MM/AA, con mes de 01 a 12 y no anterior al mes de "ahora" (hoy por defecto). */
	vencimiento: (ahora) => (valor) => {
		const texto = String(valor ?? "").trim();
		if (texto === "") return "";
		const partes = /^(\d{2})\/(\d{2})$/.exec(texto);
		if (!partes) return "Usa el formato MM/AA. Ejemplo: 08/29.";
		const mes = Number(partes[1]);
		if (mes < 1 || mes > 12) return "El mes debe estar entre 01 y 12.";

		const referencia = ahora ?? new Date();
		const vence = (2000 + Number(partes[2])) * 12 + mes;
		const actual = referencia.getFullYear() * 12 + referencia.getMonth() + 1;
		return vence < actual ? "La tarjeta esta vencida." : "";
	},

	/** Codigo de seguridad de la tarjeta: 3 o 4 digitos. */
	cvv: () => (valor) => {
		const texto = String(valor ?? "").trim();
		return texto === "" || /^\d{3,4}$/.test(texto) ? "" : "El codigo de seguridad tiene 3 o 4 digitos.";
	},

	numeroMaximo: (maximo) => (valor) => {
		if (String(valor ?? "").trim() === "") return "";
		const numero = Number(valor);
		if (Number.isNaN(numero)) return "Debe ser un numero.";
		return numero > maximo ? `No puede ser mayor que ${maximo}.` : "";
	},

	entero: () => (valor) => {
		if (String(valor ?? "").trim() === "") return "";
		const numero = Number(valor);
		if (Number.isNaN(numero)) return "Debe ser un numero.";
		return Number.isInteger(numero) ? "" : "Debe ser un numero entero, sin decimales.";
	},

	seleccion: (mensaje = "Selecciona una opcion.") => (valor) => (String(valor ?? "") === "" ? mensaje : ""),

	/** Formato libre: el valor (si no esta vacio) debe calzar completo con la expresion. */
	patron: (expresion, mensaje) => (valor) => {
		const texto = String(valor ?? "").trim();
		return texto === "" || expresion.test(texto) ? "" : mensaje;
	},
};

/** Primer error de la lista de reglas para un valor, o "" si las pasa todas. */
export const validarValor = (valor, listaDeReglas = []) =>
	listaDeReglas.map((regla) => regla(valor)).find(Boolean) ?? "";

/** Errores de todos los campos definidos: { campo: mensaje | "" }. */
export const validar = (valores, definicion) =>
	Object.fromEntries(
		Object.entries(definicion).map(([campo, listaDeReglas]) => [campo, validarValor(valores[campo], listaDeReglas)]),
	);

/**
 * Sugerencias de correo con los dominios permitidos, completando lo que el
 * usuario ya escribio antes de la arroba (RF-01 CA8).
 */
export function sugerenciasDeCorreo(escrito) {
	const local = String(escrito ?? "").trim().toLowerCase().split("@")[0];
	return DOMINIOS_PERMITIDOS.map((dominio) => `${local || "tucorreo"}${dominio}`);
}
