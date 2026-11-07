/*
 * Pasarela de pago simulada, sin DOM ni red: decide por el numero de la
 * tarjeta. Son las mismas tarjetas de prueba que usan las pasarelas reales.
 */

export const TARJETAS_DE_PRUEBA = [
	{ numero: "4242 4242 4242 4242", resultado: "Pago aprobado" },
	{ numero: "4000 0000 0000 0002", resultado: "Rechazada por el banco emisor" },
	{ numero: "4000 0000 0000 9995", resultado: "Fondos insuficientes" },
];

// Motivo con que se rechaza cada tarjeta de prueba (por su numero sin espacios).
const RECHAZOS = {
	4000000000000002: "La tarjeta fue rechazada por el banco emisor.",
	4000000000009995: "La tarjeta no tiene fondos suficientes.",
};

export const soloDigitos = (valor) => String(valor ?? "").replace(/\D/g, "");

/** Numero de tarjeta escrito en grupos de cuatro: "4242424242424242" -> "4242 4242 4242 4242". */
export const agruparTarjeta = (valor) =>
	soloDigitos(valor)
		.slice(0, 19)
		.replace(/(\d{4})(?=\d)/g, "$1 ");

/** Vencimiento escrito como MM/AA: "0829" -> "08/29". */
export function formatearVencimiento(valor) {
	const digitos = soloDigitos(valor).slice(0, 4);
	return digitos.length > 2 ? `${digitos.slice(0, 2)}/${digitos.slice(2)}` : digitos;
}

/** Texto con el que la orden recuerda el medio de pago; nunca guarda el numero completo. */
export const medioDePago = (numero) => `Tarjeta terminada en ${soloDigitos(numero).slice(-4)}`;

/**
 * Autoriza un cobro. Devuelve { aprobado: true } o { aprobado: false, motivo }.
 * Solo las tarjetas de prueba de rechazo fallan: cualquier otro numero valido
 * se aprueba.
 */
export function autorizarPago({ numero, monto }) {
	if (!(Number(monto) > 0)) return { aprobado: false, motivo: "El monto a pagar no es valido." };

	const motivo = RECHAZOS[soloDigitos(numero)];
	return motivo ? { aprobado: false, motivo } : { aprobado: true };
}
