package cl.duoc.ensamblame.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import cl.duoc.ensamblame.dto.request.BoletaRequest;
import cl.duoc.ensamblame.dto.request.LineaBoletaRequest;
import cl.duoc.ensamblame.dto.response.BoletaResponse;
import cl.duoc.ensamblame.exception.RecursoNoEncontradoException;
import cl.duoc.ensamblame.exception.ReglaNegocioException;
import cl.duoc.ensamblame.model.Boleta;
import cl.duoc.ensamblame.model.Producto;
import cl.duoc.ensamblame.model.TipoEntrega;
import cl.duoc.ensamblame.model.Usuario;
import cl.duoc.ensamblame.repository.BoletaRepository;
import cl.duoc.ensamblame.repository.ProductoRepository;
import cl.duoc.ensamblame.repository.UsuarioRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BoletaServiceTest {

    @Mock
    private BoletaRepository boletaRepository;

    @Mock
    private ProductoRepository productoRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    private BoletaService servicio;

    private final int ano = LocalDate.now().getYear();

    @BeforeEach
    void preparar() {
        servicio = new BoletaService(boletaRepository, productoRepository, usuarioRepository);
    }

    private Producto producto(String sku, String nombre, String precio, Integer descuento, int stock) {
        Producto producto = new Producto();
        producto.setSku(sku);
        producto.setNombre(nombre);
        producto.setPrecio(new BigDecimal(precio));
        producto.setDescuento(descuento);
        producto.setStock(stock);
        return producto;
    }

    // Registra una compra de la cuenta "usuario" (el RUN que vendria en el token; null = invitado).
    private BoletaResponse crear(String usuario, TipoEntrega entrega, LineaBoletaRequest... lineas) {
        BoletaRequest request = new BoletaRequest("Camila Soto Vera", "Camila@Gmail.com", "Irarrazaval 2550, Nunoa",
                "RM-04", entrega, "Tarjeta terminada en 4242", List.of(lineas));
        return servicio.crear(request, usuario);
    }

    private LineaBoletaRequest linea(String sku, int cantidad) {
        return new LineaBoletaRequest(sku, cantidad);
    }

    // Prepara el repositorio para una compra normal: no hay boletas previas y save devuelve lo recibido.
    private void prepararCompra(Producto... productos) {
        when(productoRepository.bloquearPorSku(any())).thenReturn(List.of(productos));
        when(boletaRepository.findFirstByNumeroStartingWithOrderByNumeroDesc(any())).thenReturn(Optional.empty());
        when(boletaRepository.save(any(Boleta.class))).thenAnswer(llamada -> llamada.getArgument(0));
    }

    @Test
    void crearCongelaElPrecioVigenteConElDescuentoAplicado() {
        // 249.990 con 15 % de descuento = 212.491,5, que se redondea a 212.492.
        prepararCompra(producto("CPU-R5-7600", "AMD Ryzen 5 7600", "249990", 15, 18));

        BoletaResponse respuesta = crear(null, TipoEntrega.RETIRO, linea("CPU-R5-7600", 1));

        assertEquals(new BigDecimal("212492.00"), respuesta.detalles().get(0).precioUnitario());
        assertEquals(new BigDecimal("212492.00"), respuesta.total());
    }

    @Test
    void crearSinOfertaCobraElPrecioDeLista() {
        prepararCompra(producto("PER-KB-MECH", "Teclado mecanico", "34990", null, 25));

        BoletaResponse respuesta = crear(null, TipoEntrega.RETIRO, linea("PER-KB-MECH", 2));

        assertEquals(new BigDecimal("34990.00"), respuesta.detalles().get(0).precioUnitario());
        assertEquals(new BigDecimal("69980.00"), respuesta.subtotal());
    }

    @Test
    void elDespachoABajoDe200000CobraElEnvio() {
        prepararCompra(producto("PER-KB-MECH", "Teclado mecanico", "34990", null, 25));

        BoletaResponse respuesta = crear(null, TipoEntrega.DOMICILIO, linea("PER-KB-MECH", 1));

        assertEquals(new BigDecimal("4990.00"), respuesta.costoEnvio());
        assertEquals(new BigDecimal("39980.00"), respuesta.total());
    }

    @Test
    void elDespachoDesde200000EsGratis() {
        prepararCompra(producto("CPU-R5-7600", "AMD Ryzen 5 7600", "249990", null, 18));

        BoletaResponse respuesta = crear(null, TipoEntrega.DOMICILIO, linea("CPU-R5-7600", 1));

        assertEquals(new BigDecimal("0.00"), respuesta.costoEnvio());
    }

    @Test
    void elRetiroEnTiendaNoCobraEnvio() {
        prepararCompra(producto("PER-KB-MECH", "Teclado mecanico", "34990", null, 25));

        BoletaResponse respuesta = crear(null, TipoEntrega.RETIRO, linea("PER-KB-MECH", 1));

        assertEquals(new BigDecimal("0.00"), respuesta.costoEnvio());
    }

    @Test
    void elNetoMasElIvaSumanElTotal() {
        prepararCompra(producto("PER-KB-MECH", "Teclado mecanico", "34990", null, 25));

        BoletaResponse respuesta = crear(null, TipoEntrega.DOMICILIO, linea("PER-KB-MECH", 1));

        // 39.980 / 1,19 = 33.596,6..., que se redondea a 33.597.
        assertEquals(new BigDecimal("33597.00"), respuesta.neto());
        assertEquals(new BigDecimal("6383.00"), respuesta.iva());
        assertEquals(respuesta.total(), respuesta.neto().add(respuesta.iva()));
    }

    @Test
    void crearDescuentaElStockDeCadaProducto() {
        Producto teclado = producto("PER-KB-MECH", "Teclado mecanico", "34990", null, 25);
        prepararCompra(teclado);

        crear(null, TipoEntrega.RETIRO, linea("PER-KB-MECH", 3));

        assertEquals(22, teclado.getStock());
    }

    @Test
    void unSkuRepetidoSeConsolidaEnUnaSolaLinea() {
        Producto teclado = producto("PER-KB-MECH", "Teclado mecanico", "34990", null, 25);
        prepararCompra(teclado);

        BoletaResponse respuesta = crear(null, TipoEntrega.RETIRO,
                linea("PER-KB-MECH", 1), linea("PER-KB-MECH", 2));

        assertEquals(1, respuesta.detalles().size());
        assertEquals(3, respuesta.detalles().get(0).cantidad());
        assertEquals(22, teclado.getStock());
    }

    @Test
    void sinStockSuficienteLanzaConflictoNombraElProductoYNoGuardaNada() {
        Producto agotado = producto("GPU-RTX4060", "RTX 4060", "399990", null, 0);
        Producto escaso = producto("PER-KB-MECH", "Teclado mecanico", "34990", null, 2);
        when(productoRepository.bloquearPorSku(any())).thenReturn(List.of(agotado, escaso));

        ReglaNegocioException error = assertThrows(ReglaNegocioException.class,
                () -> crear(null, TipoEntrega.RETIRO, linea("GPU-RTX4060", 1), linea("PER-KB-MECH", 5)));

        assertTrue(error.getMessage().contains("RTX 4060 (sin stock)"));
        assertTrue(error.getMessage().contains("Teclado mecanico (quedan 2)"));
        assertEquals(2, escaso.getStock());
        verify(boletaRepository, never()).save(any());
    }

    @Test
    void unSkuInexistenteLanzaNoEncontradoYNoGuardaNada() {
        when(productoRepository.bloquearPorSku(any())).thenReturn(List.of());

        assertThrows(RecursoNoEncontradoException.class,
                () -> crear(null, TipoEntrega.RETIRO, linea("NO-EXISTE", 1)));

        verify(boletaRepository, never()).save(any());
    }

    @Test
    void unUsuarioInexistenteLanzaNoEncontradoYNoGuardaNada() {
        when(usuarioRepository.findById("123456785")).thenReturn(Optional.empty());

        assertThrows(RecursoNoEncontradoException.class,
                () -> crear("123456785", TipoEntrega.RETIRO, linea("PER-KB-MECH", 1)));

        verify(boletaRepository, never()).save(any());
    }

    @Test
    void laCompraConCuentaQuedaANombreDelUsuarioYLaDeInvitadoSinDueno() {
        Usuario camila = new Usuario();
        camila.setRun("123456785");
        when(usuarioRepository.findById("123456785")).thenReturn(Optional.of(camila));
        prepararCompra(producto("PER-KB-MECH", "Teclado mecanico", "34990", null, 25));

        BoletaResponse conCuenta = crear("123456785", TipoEntrega.RETIRO, linea("PER-KB-MECH", 1));
        BoletaResponse invitado = crear(null, TipoEntrega.RETIRO, linea("PER-KB-MECH", 1));

        assertEquals("123456785", conCuenta.usuario());
        assertNull(invitado.usuario());
    }

    @Test
    void elCorreoSeGuardaEnMinusculas() {
        prepararCompra(producto("PER-KB-MECH", "Teclado mecanico", "34990", null, 25));

        crear(null, TipoEntrega.RETIRO, linea("PER-KB-MECH", 1));

        ArgumentCaptor<Boleta> guardada = ArgumentCaptor.forClass(Boleta.class);
        verify(boletaRepository).save(guardada.capture());
        assertEquals("camila@gmail.com", guardada.getValue().getCorreo());
    }

    @Test
    void laPrimeraBoletaDelAnoEsLaNumeroUno() {
        prepararCompra(producto("PER-KB-MECH", "Teclado mecanico", "34990", null, 25));

        BoletaResponse respuesta = crear(null, TipoEntrega.RETIRO, linea("PER-KB-MECH", 1));

        assertEquals("ORD-" + ano + "-0001", respuesta.numero());
    }

    @Test
    void lasSiguientesBoletasContinuanElCorrelativoDelAno() {
        Boleta ultima = new Boleta();
        ultima.setNumero("ORD-" + ano + "-0007");
        when(productoRepository.bloquearPorSku(any()))
                .thenReturn(List.of(producto("PER-KB-MECH", "Teclado mecanico", "34990", null, 25)));
        when(boletaRepository.findFirstByNumeroStartingWithOrderByNumeroDesc("ORD-" + ano + "-"))
                .thenReturn(Optional.of(ultima));
        when(boletaRepository.save(any(Boleta.class))).thenAnswer(llamada -> llamada.getArgument(0));

        BoletaResponse respuesta = crear(null, TipoEntrega.RETIRO, linea("PER-KB-MECH", 1));

        assertEquals("ORD-" + ano + "-0008", respuesta.numero());
    }

    @Test
    void obtenerUnaBoletaInexistenteLanzaNoEncontrado() {
        when(boletaRepository.findById("ORD-2026-9999")).thenReturn(Optional.empty());

        assertThrows(RecursoNoEncontradoException.class, () -> servicio.obtener("ORD-2026-9999", null));
    }

    private Boleta boletaDe(String run) {
        Boleta boleta = new Boleta();
        boleta.setNumero("ORD-2026-0001");
        boleta.setFecha(LocalDate.of(2026, 10, 5));
        boleta.setCostoEnvio(BigDecimal.ZERO);
        if (run != null) {
            Usuario usuario = new Usuario();
            usuario.setRun(run);
            boleta.setUsuario(usuario);
        }
        return boleta;
    }

    @Test
    void unClienteVeSuPropiaBoleta() {
        when(boletaRepository.findById("ORD-2026-0001")).thenReturn(Optional.of(boletaDe("123456785")));

        assertEquals("ORD-2026-0001", servicio.obtener("ORD-2026-0001", "123456785").numero());
    }

    @Test
    void unClienteNoVeLaBoletaDeOtraCuentaNiLaDeUnInvitado() {
        when(boletaRepository.findById("ORD-2026-0001"))
                .thenReturn(Optional.of(boletaDe("152345674")), Optional.of(boletaDe(null)));

        assertThrows(RecursoNoEncontradoException.class, () -> servicio.obtener("ORD-2026-0001", "123456785"));
        assertThrows(RecursoNoEncontradoException.class, () -> servicio.obtener("ORD-2026-0001", "123456785"));
    }

    @Test
    void elPersonalVeCualquierBoleta() {
        when(boletaRepository.findById("ORD-2026-0001")).thenReturn(Optional.of(boletaDe(null)));

        assertEquals("ORD-2026-0001", servicio.obtener("ORD-2026-0001", null).numero());
    }

    @Test
    void listarSinUsuarioDevuelveTodasYConUsuarioSoloLasDeEsaCuenta() {
        when(boletaRepository.findAllByOrderByFechaDescNumeroDesc()).thenReturn(List.of());
        when(boletaRepository.findByUsuarioRunOrderByFechaDescNumeroDesc("123456785")).thenReturn(List.of());

        servicio.listar(null);
        servicio.listar("123456785");

        verify(boletaRepository).findAllByOrderByFechaDescNumeroDesc();
        verify(boletaRepository).findByUsuarioRunOrderByFechaDescNumeroDesc("123456785");
    }
}
