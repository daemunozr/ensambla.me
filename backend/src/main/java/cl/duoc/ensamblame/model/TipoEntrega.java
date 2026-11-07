package cl.duoc.ensamblame.model;

import java.math.BigDecimal;

/** Forma de entrega de una compra y su costo de envio. */
public enum TipoEntrega {
    // El despacho a domicilio cuesta $4.990 y es gratis desde $200.000 en productos.
    DOMICILIO(new BigDecimal("4990"), new BigDecimal("200000")),
    RETIRO(BigDecimal.ZERO, null);

    private final BigDecimal costo;
    // Subtotal desde el cual el envio no se cobra; null si el costo siempre se aplica.
    private final BigDecimal gratisDesde;

    TipoEntrega(BigDecimal costo, BigDecimal gratisDesde) {
        this.costo = costo;
        this.gratisDesde = gratisDesde;
    }

    public BigDecimal costoEnvio(BigDecimal subtotal) {
        if (gratisDesde != null && subtotal.compareTo(gratisDesde) >= 0) {
            return BigDecimal.ZERO;
        }
        return costo;
    }
}
