package cl.duoc.ensamblame.dto.response;

import java.math.BigDecimal;

/** Una linea de la boleta con el precio unitario que se cobro. */
public record DetalleBoletaResponse(
        String sku,
        String nombreProducto,
        Integer cantidad,
        BigDecimal precioUnitario,
        BigDecimal subtotal) {
}
