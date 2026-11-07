package cl.duoc.ensamblame.service;

import cl.duoc.ensamblame.dto.request.BoletaRequest;
import cl.duoc.ensamblame.dto.request.LineaBoletaRequest;
import cl.duoc.ensamblame.dto.response.BoletaResponse;
import cl.duoc.ensamblame.dto.response.DetalleBoletaResponse;
import cl.duoc.ensamblame.exception.RecursoNoEncontradoException;
import cl.duoc.ensamblame.exception.ReglaNegocioException;
import cl.duoc.ensamblame.model.Boleta;
import cl.duoc.ensamblame.model.DetalleBoleta;
import cl.duoc.ensamblame.model.Producto;
import cl.duoc.ensamblame.model.Usuario;
import cl.duoc.ensamblame.repository.BoletaRepository;
import cl.duoc.ensamblame.repository.ProductoRepository;
import cl.duoc.ensamblame.repository.UsuarioRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BoletaService {

    // Los precios del sitio incluyen IVA (19 %).
    private static final BigDecimal FACTOR_IVA = new BigDecimal("1.19");
    private static final int MAXIMO_DESCUENTO = 90;

    private final BoletaRepository boletaRepository;
    private final ProductoRepository productoRepository;
    private final UsuarioRepository usuarioRepository;

    public BoletaService(BoletaRepository boletaRepository, ProductoRepository productoRepository,
            UsuarioRepository usuarioRepository) {
        this.boletaRepository = boletaRepository;
        this.productoRepository = productoRepository;
        this.usuarioRepository = usuarioRepository;
    }

    /** Sin "usuario" devuelve todas; con el RUN de una cuenta, solo las suyas. De la mas reciente a la mas antigua. */
    @Transactional(readOnly = true)
    public List<BoletaResponse> listar(String usuario) {
        List<Boleta> boletas = (usuario != null && !usuario.isBlank())
                ? boletaRepository.findByUsuarioRunOrderByFechaDescNumeroDesc(usuario.toUpperCase())
                : boletaRepository.findAllByOrderByFechaDescNumeroDesc();
        return boletas.stream().map(this::aResponse).toList();
    }

    @Transactional(readOnly = true)
    public BoletaResponse obtener(String numero) {
        return aResponse(boletaRepository.findById(numero)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe la boleta " + numero + ".")));
    }

    /**
     * Registra la compra en una sola transaccion: valida el stock de todas las lineas antes de
     * escribir, congela el precio vigente de cada producto, calcula el envio y descuenta el stock.
     * Si algo falla no cambia nada.
     */
    @Transactional
    public BoletaResponse crear(BoletaRequest request) {
        Usuario usuario = buscarUsuario(request.usuario());
        Map<String, Integer> cantidades = consolidar(request.lineas());
        Map<String, Producto> productos = bloquearProductos(cantidades);
        validarStock(cantidades, productos);

        LocalDate fecha = LocalDate.now();
        Boleta boleta = new Boleta();
        boleta.setNumero(siguienteNumero(fecha));
        boleta.setUsuario(usuario);
        boleta.setFecha(fecha);
        boleta.setNombre(request.nombre());
        boleta.setCorreo(request.correo().toLowerCase());
        boleta.setDireccion(request.direccion());
        boleta.setComuna(request.comuna());
        boleta.setEntrega(request.entrega());
        boleta.setMedioPago(request.medioPago());

        cantidades.forEach((sku, cantidad) -> {
            Producto producto = productos.get(sku);
            boleta.agregarDetalle(producto, cantidad, precioVigente(producto));
            producto.setStock(producto.getStock() - cantidad);
        });
        boleta.setCostoEnvio(pesos(request.entrega().costoEnvio(boleta.subtotal())));

        return aResponse(boletaRepository.save(boleta));
    }

    private Usuario buscarUsuario(String run) {
        if (run == null || run.isBlank()) {
            return null;
        }
        return usuarioRepository.findById(run.toUpperCase())
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe el usuario " + run + "."));
    }

    // Una sola linea por SKU: las cantidades de un SKU repetido se suman.
    private Map<String, Integer> consolidar(List<LineaBoletaRequest> lineas) {
        Map<String, Integer> cantidades = new LinkedHashMap<>();
        lineas.forEach(linea -> cantidades.merge(linea.sku(), linea.cantidad(), Integer::sum));
        return cantidades;
    }

    private Map<String, Producto> bloquearProductos(Map<String, Integer> cantidades) {
        Map<String, Producto> productos = productoRepository.bloquearPorSku(cantidades.keySet()).stream()
                .collect(Collectors.toMap(Producto::getSku, Function.identity()));
        cantidades.keySet().forEach(sku -> {
            if (!productos.containsKey(sku)) {
                throw new RecursoNoEncontradoException("No existe el producto " + sku + ".");
            }
        });
        return productos;
    }

    // Nombra todos los productos que no alcanzan, no solo el primero.
    private void validarStock(Map<String, Integer> cantidades, Map<String, Producto> productos) {
        List<String> faltantes = new ArrayList<>();
        cantidades.forEach((sku, cantidad) -> {
            Producto producto = productos.get(sku);
            if (producto.getStock() <= 0) {
                faltantes.add(producto.getNombre() + " (sin stock)");
            } else if (producto.getStock() < cantidad) {
                faltantes.add(producto.getNombre() + " (quedan " + producto.getStock() + ")");
            }
        });
        if (!faltantes.isEmpty()) {
            throw new ReglaNegocioException("Sin stock suficiente: " + String.join(", ", faltantes) + ".");
        }
    }

    // ORD-AAAA-NNNN, correlativo dentro del ano de la fecha.
    private String siguienteNumero(LocalDate fecha) {
        String prefijo = "ORD-" + fecha.getYear() + "-";
        int ultimo = boletaRepository.findFirstByNumeroStartingWithOrderByNumeroDesc(prefijo)
                .map(boleta -> Integer.parseInt(boleta.getNumero().substring(prefijo.length())))
                .orElse(0);
        return prefijo + String.format("%04d", ultimo + 1);
    }

    /** Precio con el descuento aplicado, redondeado a pesos; sin oferta es el precio de lista. */
    private BigDecimal precioVigente(Producto producto) {
        int descuento = producto.getDescuento() == null ? 0 : Math.min(producto.getDescuento(), MAXIMO_DESCUENTO);
        if (descuento <= 0) {
            return pesos(producto.getPrecio());
        }
        BigDecimal vigente = producto.getPrecio().multiply(BigDecimal.valueOf(100 - descuento))
                .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
        return pesos(vigente);
    }

    // Misma escala que las columnas decimal(12,2), para que la respuesta no cambie al releerla.
    private BigDecimal pesos(BigDecimal monto) {
        return monto.setScale(2, RoundingMode.HALF_UP);
    }

    private BoletaResponse aResponse(Boleta b) {
        List<DetalleBoletaResponse> detalles = b.getDetalles().stream()
                .map(d -> new DetalleBoletaResponse(d.getProducto().getSku(), d.getProducto().getNombre(),
                        d.getCantidad(), d.getPrecioUnitario(), pesos(d.subtotal())))
                .toList();
        BigDecimal subtotal = pesos(b.subtotal());
        BigDecimal total = subtotal.add(b.getCostoEnvio());
        // Los precios incluyen IVA: el neto es el total dividido por 1,19 y el IVA, lo que sobra.
        BigDecimal neto = pesos(total.divide(FACTOR_IVA, 0, RoundingMode.HALF_UP));
        return new BoletaResponse(b.getNumero(), b.getUsuario() == null ? null : b.getUsuario().getRun(),
                b.getFecha(), b.getNombre(), b.getCorreo(), b.getDireccion(), b.getComuna(), b.getEntrega(),
                b.getMedioPago(), detalles, subtotal, b.getCostoEnvio(), total, neto, total.subtract(neto));
    }
}
