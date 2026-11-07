package cl.duoc.ensamblame.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;

/** Clave compuesta de un detalle: la boleta y el producto (un producto aparece una vez por boleta). */
@Embeddable
public class DetalleBoletaId implements Serializable {

    @Column(length = 14)
    private String boleta;

    @Column(length = 50)
    private String producto;

    public DetalleBoletaId() {
    }

    public DetalleBoletaId(String boleta, String producto) {
        this.boleta = boleta;
        this.producto = producto;
    }

    public String getBoleta() {
        return boleta;
    }

    public String getProducto() {
        return producto;
    }

    @Override
    public boolean equals(Object otro) {
        if (this == otro) {
            return true;
        }
        if (!(otro instanceof DetalleBoletaId id)) {
            return false;
        }
        return Objects.equals(boleta, id.boleta) && Objects.equals(producto, id.producto);
    }

    @Override
    public int hashCode() {
        return Objects.hash(boleta, producto);
    }
}
