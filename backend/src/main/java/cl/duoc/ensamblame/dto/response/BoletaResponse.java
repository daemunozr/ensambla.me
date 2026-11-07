package cl.duoc.ensamblame.dto.response;

import cl.duoc.ensamblame.model.TipoEntrega;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Boleta tal como la ve el cliente de la API. "usuario" es el RUN, o null si fue una compra de
 * invitado. Los precios incluyen IVA: neto + iva = total.
 */
public record BoletaResponse(
        String numero,
        String usuario,
        LocalDate fecha,
        String nombre,
        String correo,
        String direccion,
        String comuna,
        TipoEntrega entrega,
        String medioPago,
        List<DetalleBoletaResponse> detalles,
        BigDecimal subtotal,
        BigDecimal costoEnvio,
        BigDecimal total,
        BigDecimal neto,
        BigDecimal iva) {
}
