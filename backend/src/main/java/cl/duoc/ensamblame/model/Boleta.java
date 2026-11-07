package cl.duoc.ensamblame.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/** Compra registrada. El total, el neto y el IVA no se guardan: se calculan a partir del detalle. */
@Entity
@Table(name = "boletas")
public class Boleta {

    // ORD-AAAA-NNNN, correlativo dentro del ano de la fecha.
    @Id
    @Column(length = 14)
    private String numero;

    // Cuenta con la que se compro; null si fue una compra de invitado.
    @ManyToOne
    @JoinColumn(name = "usuario_run")
    private Usuario usuario;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(nullable = false, length = 150)
    private String nombre;

    @Column(nullable = false, length = 100)
    private String correo;

    @Column(nullable = false, length = 300)
    private String direccion;

    @Column(nullable = false, length = 10)
    private String comuna;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private TipoEntrega entrega;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal costoEnvio;

    @Column(nullable = false, length = 50)
    private String medioPago;

    @OneToMany(mappedBy = "boleta", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DetalleBoleta> detalles = new ArrayList<>();

    public Boleta() {
    }

    /** Agrega una linea. La boleta ya debe tener su numero, que forma parte de la clave del detalle. */
    public void agregarDetalle(Producto producto, int cantidad, BigDecimal precioUnitario) {
        detalles.add(new DetalleBoleta(this, producto, cantidad, precioUnitario));
    }

    /** Suma de las lineas (precios con IVA incluido), sin el envio. */
    public BigDecimal subtotal() {
        return detalles.stream().map(DetalleBoleta::subtotal).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public String getNumero() {
        return numero;
    }

    public void setNumero(String numero) {
        this.numero = numero;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public void setFecha(LocalDate fecha) {
        this.fecha = fecha;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getCorreo() {
        return correo;
    }

    public void setCorreo(String correo) {
        this.correo = correo;
    }

    public String getDireccion() {
        return direccion;
    }

    public void setDireccion(String direccion) {
        this.direccion = direccion;
    }

    public String getComuna() {
        return comuna;
    }

    public void setComuna(String comuna) {
        this.comuna = comuna;
    }

    public TipoEntrega getEntrega() {
        return entrega;
    }

    public void setEntrega(TipoEntrega entrega) {
        this.entrega = entrega;
    }

    public BigDecimal getCostoEnvio() {
        return costoEnvio;
    }

    public void setCostoEnvio(BigDecimal costoEnvio) {
        this.costoEnvio = costoEnvio;
    }

    public String getMedioPago() {
        return medioPago;
    }

    public void setMedioPago(String medioPago) {
        this.medioPago = medioPago;
    }

    public List<DetalleBoleta> getDetalles() {
        return detalles;
    }
}
