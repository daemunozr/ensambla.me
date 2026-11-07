package cl.duoc.ensamblame.model;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import java.math.BigDecimal;

/** Una linea de la boleta: un producto, la cantidad y el precio vigente al momento de comprar. */
@Entity
@Table(name = "detalles_boleta")
public class DetalleBoleta {

    @EmbeddedId
    private DetalleBoletaId id;

    @MapsId("boleta")
    @ManyToOne(optional = false)
    @JoinColumn(name = "boleta_numero")
    private Boleta boleta;

    @MapsId("producto")
    @ManyToOne(optional = false)
    @JoinColumn(name = "producto_sku")
    private Producto producto;

    @Column(nullable = false)
    private Integer cantidad;

    // Precio con la oferta aplicada, congelado: el precio del producto puede cambiar despues.
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal precioUnitario;

    public DetalleBoleta() {
    }

    public DetalleBoleta(Boleta boleta, Producto producto, int cantidad, BigDecimal precioUnitario) {
        this.id = new DetalleBoletaId(boleta.getNumero(), producto.getSku());
        this.boleta = boleta;
        this.producto = producto;
        this.cantidad = cantidad;
        this.precioUnitario = precioUnitario;
    }

    public DetalleBoletaId getId() {
        return id;
    }

    public Boleta getBoleta() {
        return boleta;
    }

    public Producto getProducto() {
        return producto;
    }

    public Integer getCantidad() {
        return cantidad;
    }

    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
    }

    public BigDecimal getPrecioUnitario() {
        return precioUnitario;
    }

    public void setPrecioUnitario(BigDecimal precioUnitario) {
        this.precioUnitario = precioUnitario;
    }

    public BigDecimal subtotal() {
        return precioUnitario.multiply(BigDecimal.valueOf(cantidad));
    }
}
