import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { ZonaAviso } from "../components/Alerta.jsx";
import Campo from "../components/Campo.jsx";
import CampoCorreo from "../components/CampoCorreo.jsx";
import EstadoVacio from "../components/EstadoVacio.jsx";
import ResumenPedido from "../components/ResumenPedido.jsx";
import SelectRegionComuna from "../components/SelectRegionComuna.jsx";
import { useCarrito } from "../context/carrito.js";
import { useDatos } from "../context/datos.js";
import { useSesion } from "../context/sesion.js";
import { comuna, producto as buscarProducto, usuario } from "../data/datos.js";
import { useFormulario } from "../hooks/useFormulario.js";
import { useTitulo } from "../hooks/useTitulo.js";
import { OPCIONES_ENTREGA, consolidar, costoEnvio, faltantes } from "../logic/checkout.js";
import {
	TARJETAS_DE_PRUEBA,
	agruparTarjeta,
	autorizarPago,
	formatearVencimiento,
	medioDePago,
} from "../logic/pago.js";
import { precio } from "../utils/formato.js";
import { reglas } from "../utils/validaciones.js";

const VACIO = {
	nombre: "",
	apellidos: "",
	correo: "",
	region: "",
	comuna: "",
	direccion: "",
	tarjeta: "",
	vencimiento: "",
	cvv: "",
};

// Datos de contacto y envio: siempre se piden.
const DATOS_DE_ENVIO = {
	nombre: [reglas.requerido(), reglas.maximo(50)],
	apellidos: [reglas.requerido(), reglas.maximo(100)],
	correo: [reglas.requerido(), reglas.maximo(100), reglas.correo()],
	region: [reglas.seleccion("Selecciona tu region.")],
	comuna: [reglas.seleccion("Selecciona tu comuna.")],
	direccion: [reglas.requerido(), reglas.maximo(300)],
};

// Tarjeta: solo si hay algo que pagar.
const DATOS_DE_PAGO = {
	tarjeta: [reglas.requerido(), reglas.tarjeta()],
	vencimiento: [reglas.requerido(), reglas.vencimiento()],
	cvv: [reglas.requerido(), reglas.cvv()],
};

/**
 * Valores con que parte el formulario, por prioridad: los datos de envio de un
 * intento anterior (la tarjeta nunca se conserva), los de la cuenta con la
 * sesion iniciada, o vacio.
 */
function valoresIniciales(estado, sesion) {
	if (estado?.datos) return { ...VACIO, ...estado.datos };

	const cuenta = sesion ? usuario(sesion.run) : null;
	if (!cuenta) return VACIO;
	return {
		...VACIO,
		nombre: cuenta.nombre,
		apellidos: cuenta.apellidos,
		correo: cuenta.correo,
		region: comuna(cuenta.comuna)?.region ?? "",
		comuna: cuenta.comuna,
		direccion: cuenta.direccion,
	};
}

function Formulario({ lineas, subtotal, onTerminar }) {
	const navegar = useNavigate();
	const { state } = useLocation();
	const { sesion } = useSesion();
	const { crearOrden } = useDatos();
	const { vaciar } = useCarrito();

	const [inicial] = useState(() => valoresIniciales(state, sesion));
	const [entrega, setEntrega] = useState(state?.datos?.entrega ?? OPCIONES_ENTREGA[0].codigo);
	const [aviso, setAviso] = useState(null);

	const envio = costoEnvio(entrega, subtotal);
	const total = subtotal + envio;
	// Un pedido sin costo (productos gratis y retiro en tienda) no pide tarjeta. Se decide con la
	// entrega y no con valores del formulario, para no depender del propio formulario.
	const requierePago = total > 0;
	const definicion = useMemo(
		() => (requierePago ? { ...DATOS_DE_ENVIO, ...DATOS_DE_PAGO } : DATOS_DE_ENVIO),
		[requierePago],
	);

	const formulario = useFormulario(inicial, definicion);
	const { registrar, estado, errores, enviar } = formulario;
	const items = consolidar(lineas, buscarProducto);

	const alEnviar = (datos) => {
		// Se comprueba el stock antes de cobrar: despues de aprobar el pago ya no se puede rechazar.
		const sinStock = faltantes(items, buscarProducto);
		if (sinStock.length) {
			setAviso({
				tipo: "danger",
				contenido: `Sin stock suficiente: ${sinStock.join(", ")}. Ajusta tu carrito e intenta de nuevo.`,
			});
			return;
		}

		let medio = "Sin pago";
		if (requierePago) {
			const pago = autorizarPago({ numero: datos.tarjeta, monto: total });
			if (!pago.aprobado) {
				// Solo los datos de envio viajan al reintento; la tarjeta no se conserva.
				const datosDeEnvio = {
					nombre: datos.nombre,
					apellidos: datos.apellidos,
					correo: datos.correo,
					region: datos.region,
					comuna: datos.comuna,
					direccion: datos.direccion,
					entrega,
				};
				navegar("/pago/error", { state: { motivo: pago.motivo, datos: datosDeEnvio } });
				return;
			}
			medio = medioDePago(datos.tarjeta);
		}

		const resultado = crearOrden({
			cliente: sesion?.run ?? "",
			comprador: {
				nombre: `${datos.nombre} ${datos.apellidos}`,
				correo: datos.correo,
				direccion: datos.direccion,
				comuna: datos.comuna,
			},
			entrega,
			medioPago: medio,
			lineas,
		});
		if (!resultado.ok) {
			setAviso({ tipo: "danger", contenido: resultado.mensaje });
			return;
		}

		// Los tres cambios van juntos: la vista muestra "procesando" y no un carrito vacio.
		onTerminar();
		vaciar();
		navegar(`/pago/correcto/${encodeURIComponent(resultado.registro.numero)}`);
	};

	const props = (nombre) => ({ error: errores[nombre], estado: estado(nombre), ...registrar(nombre) });
	const tarjeta = registrar("tarjeta");
	const vencimiento = registrar("vencimiento");

	return (
		<main>
			<p className="sobretitulo">Tu compra</p>
			<h1 className="h3">Finalizar compra</h1>
			<p className="text-secondary mb-4">
				{sesion ? (
					"Tus datos de la cuenta ya estan completos; puedes cambiarlos para esta compra."
				) : (
					<>
						Completa tus datos para recibir el pedido. Si tienes una cuenta,{" "}
						<Link to="/login?destino=%2Fcheckout">inicia sesion</Link> y se completan solos.
					</>
				)}
			</p>

			<div className="row g-4">
				<div className="col-12 col-lg-8">
					<ZonaAviso aviso={aviso} />

					<form noValidate onSubmit={enviar(alEnviar)}>
						<section className="tarjeta-formulario p-4 mb-4" aria-labelledby="checkout-datos">
							<h2 className="h5 mb-3" id="checkout-datos">
								Tus datos
							</h2>
							<div className="row g-3">
								<Campo
									className="col-12 col-md-6"
									id="checkout-nombre"
									etiqueta="Nombre"
									obligatorio
									maxLength={50}
									autoComplete="given-name"
									sugerencia="Hasta 50 caracteres."
									{...props("nombre")}
								/>
								<Campo
									className="col-12 col-md-6"
									id="checkout-apellidos"
									etiqueta="Apellidos"
									obligatorio
									maxLength={100}
									autoComplete="family-name"
									sugerencia="Hasta 100 caracteres."
									{...props("apellidos")}
								/>
								<CampoCorreo
									className="col-12"
									id="checkout-correo"
									etiqueta="Correo"
									obligatorio
									autoComplete="email"
									sugerencia="Dominios aceptados: @duoc.cl, @profesor.duoc.cl y @gmail.com."
									{...props("correo")}
								/>
								<SelectRegionComuna formulario={formulario} prefijo="checkout" className="col-12 col-md-6" />
								<Campo
									className="col-12"
									id="checkout-direccion"
									etiqueta="Direccion"
									obligatorio
									maxLength={300}
									autoComplete="address-line1"
									sugerencia="Calle, numero y departamento. Hasta 300 caracteres."
									{...props("direccion")}
								/>
							</div>
						</section>

						<section className="tarjeta-formulario p-4 mb-4">
							<fieldset>
								<legend className="h5 mb-3">Entrega</legend>
								{OPCIONES_ENTREGA.map((opcion) => {
									const costo = costoEnvio(opcion.codigo, subtotal);
									return (
										<div className="form-check mb-2" key={opcion.codigo}>
											<input
												className="form-check-input"
												type="radio"
												name="entrega"
												id={`entrega-${opcion.codigo}`}
												value={opcion.codigo}
												checked={entrega === opcion.codigo}
												onChange={() => setEntrega(opcion.codigo)}
											/>
											<label className="form-check-label" htmlFor={`entrega-${opcion.codigo}`}>
												{opcion.nombre} <span className="text-secondary">&middot; {costo === 0 ? "Gratis" : precio(costo)}</span>
												{opcion.gratisDesde !== null && (
													<span className="d-block small text-secondary">
														Gratis desde {precio(opcion.gratisDesde)} en productos.
													</span>
												)}
											</label>
										</div>
									);
								})}
							</fieldset>
						</section>

						{requierePago ? (
							<section className="tarjeta-formulario p-4 mb-4" aria-labelledby="checkout-pago">
								<h2 className="h5 mb-1" id="checkout-pago">
									Pago con tarjeta
								</h2>
								<p className="small text-secondary mb-3">
									Pago simulado: no se realiza ningun cobro y el numero de la tarjeta no se guarda.
								</p>
								<div className="row g-3">
									<Campo
										className="col-12"
										id="checkout-tarjeta"
										etiqueta="Numero de la tarjeta"
										obligatorio
										inputMode="numeric"
										maxLength={23}
										autoComplete="cc-number"
										sugerencia={`Tarjetas de prueba: ${TARJETAS_DE_PRUEBA.map((t) => `${t.numero} (${t.resultado})`).join("; ")}.`}
										error={errores.tarjeta}
										estado={estado("tarjeta")}
										{...tarjeta}
										onChange={(evento) => {
											evento.target.value = agruparTarjeta(evento.target.value);
											tarjeta.onChange(evento);
										}}
									/>
									<Campo
										className="col-6"
										id="checkout-vencimiento"
										etiqueta="Vencimiento"
										obligatorio
										inputMode="numeric"
										maxLength={5}
										placeholder="MM/AA"
										autoComplete="cc-exp"
										sugerencia="Mes y ano, por ejemplo 08/29."
										error={errores.vencimiento}
										estado={estado("vencimiento")}
										{...vencimiento}
										onChange={(evento) => {
											evento.target.value = formatearVencimiento(evento.target.value);
											vencimiento.onChange(evento);
										}}
									/>
									<Campo
										className="col-6"
										id="checkout-cvv"
										etiqueta="Codigo de seguridad"
										obligatorio
										type="password"
										inputMode="numeric"
										maxLength={4}
										autoComplete="cc-csc"
										sugerencia="3 o 4 digitos al reverso."
										{...props("cvv")}
									/>
								</div>
							</section>
						) : (
							<p className="small text-secondary">Este pedido no tiene costo: no necesitas pagar con tarjeta.</p>
						)}

						<div className="d-flex flex-wrap gap-2 mb-4">
							<button type="submit" className="btn btn-primary btn-lg">
								{requierePago ? `Pagar ${precio(total)}` : "Confirmar pedido"}
							</button>
							<Link className="btn btn-outline-primary btn-lg" to="/carrito">
								Volver al carrito
							</Link>
						</div>
					</form>
				</div>

				<div className="col-12 col-lg-4">
					<ResumenPedido items={items} subtotal={subtotal} envio={envio} total={total} />
				</div>
			</div>
		</main>
	);
}

/** Pago de la compra: datos de envio, entrega y tarjeta, con el carrito como resumen. */
export default function Checkout() {
	useTitulo("Checkout — Ensambla.me");
	const { lineas, total } = useCarrito();
	const [terminado, setTerminado] = useState(false);

	if (terminado) {
		return (
			<main aria-live="polite">
				<h1 className="h3">Procesando tu pedido</h1>
				<p className="text-secondary">Un momento, estamos registrando tu compra.</p>
			</main>
		);
	}

	if (!lineas.length) {
		return (
			<main>
				<h1 className="h3 mb-3">Finalizar compra</h1>
				<EstadoVacio>
					<p className="mb-3">Tu carrito esta vacio, no hay nada que pagar.</p>
					<Link className="btn btn-primary" to="/productos">
						Ver el catalogo
					</Link>
				</EstadoVacio>
			</main>
		);
	}

	return <Formulario lineas={lineas} subtotal={total} onTerminar={() => setTerminado(true)} />;
}
