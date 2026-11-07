package cl.duoc.ensamblame.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import cl.duoc.ensamblame.dto.request.ProductoRequest;
import cl.duoc.ensamblame.dto.response.ProductoResponse;
import cl.duoc.ensamblame.exception.RecursoNoEncontradoException;
import cl.duoc.ensamblame.exception.ReglaNegocioException;
import cl.duoc.ensamblame.model.Categoria;
import cl.duoc.ensamblame.model.Producto;
import cl.duoc.ensamblame.repository.BoletaRepository;
import cl.duoc.ensamblame.repository.CategoriaRepository;
import cl.duoc.ensamblame.repository.ProductoRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ProductoServiceTest {

    @Mock
    private ProductoRepository productoRepository;

    @Mock
    private CategoriaRepository categoriaRepository;

    @Mock
    private BoletaRepository boletaRepository;

    private ProductoService servicio;

    private final Categoria cpu = new Categoria("cpu", "Procesadores (CPU)", 1);

    @BeforeEach
    void preparar() {
        servicio = new ProductoService(productoRepository, categoriaRepository, boletaRepository);
    }

    private ProductoRequest request(String sku) {
        return new ProductoRequest(sku, "AMD Ryzen 5 7600", "Seis nucleos", new BigDecimal("249990"), 15, 18, 5,
                null, null, "cpu");
    }

    @Test
    void crearGuardaElProductoYDevuelveSuResponse() {
        when(productoRepository.existsById("CPU-R5-7600")).thenReturn(false);
        when(categoriaRepository.findById("cpu")).thenReturn(Optional.of(cpu));
        // save devuelve el mismo objeto que recibe.
        when(productoRepository.save(any(Producto.class))).thenAnswer(llamada -> llamada.getArgument(0));

        ProductoResponse respuesta = servicio.crear(request("CPU-R5-7600"));

        assertEquals("CPU-R5-7600", respuesta.sku());
        assertEquals("cpu", respuesta.categoria());
        assertEquals("Procesadores (CPU)", respuesta.nombreCategoria());
        assertEquals(new BigDecimal("249990"), respuesta.precio());
    }

    @Test
    void crearConUnSkuRepetidoLanzaConflictoYNoGuarda() {
        when(productoRepository.existsById("CPU-R5-7600")).thenReturn(true);

        assertThrows(ReglaNegocioException.class, () -> servicio.crear(request("CPU-R5-7600")));

        verify(productoRepository, never()).save(any());
    }

    @Test
    void crearConUnaCategoriaInexistenteLanzaNoEncontrado() {
        when(productoRepository.existsById("CPU-R5-7600")).thenReturn(false);
        when(categoriaRepository.findById("cpu")).thenReturn(Optional.empty());

        assertThrows(RecursoNoEncontradoException.class, () -> servicio.crear(request("CPU-R5-7600")));

        verify(productoRepository, never()).save(any());
    }

    @Test
    void actualizarCambiaLosDatosPeroNoElSku() {
        Producto existente = new Producto();
        existente.setSku("CPU-R5-7600");
        existente.setCategoria(cpu);
        when(productoRepository.findById("CPU-R5-7600")).thenReturn(Optional.of(existente));
        when(categoriaRepository.findById("cpu")).thenReturn(Optional.of(cpu));
        when(productoRepository.save(any(Producto.class))).thenAnswer(llamada -> llamada.getArgument(0));

        // El SKU del cuerpo es otro: se ignora.
        ProductoResponse respuesta = servicio.actualizar("CPU-R5-7600", request("OTRO-SKU"));

        assertEquals("CPU-R5-7600", respuesta.sku());
        assertEquals("AMD Ryzen 5 7600", respuesta.nombre());
    }

    @Test
    void eliminarUnProductoInexistenteLanzaNoEncontrado() {
        when(productoRepository.findById("NO-EXISTE")).thenReturn(Optional.empty());

        assertThrows(RecursoNoEncontradoException.class, () -> servicio.eliminar("NO-EXISTE"));

        verify(productoRepository, never()).delete(any());
    }

    @Test
    void eliminarUnProductoConBoletasLanzaConflictoYNoLoBorra() {
        when(productoRepository.findById("CPU-R5-7600")).thenReturn(Optional.of(new Producto()));
        when(boletaRepository.existsByDetallesProductoSku("CPU-R5-7600")).thenReturn(true);

        assertThrows(ReglaNegocioException.class, () -> servicio.eliminar("CPU-R5-7600"));

        verify(productoRepository, never()).delete(any());
    }

    @Test
    void listarPorCategoriaUsaElFiltroDeCategoria() {
        Producto producto = new Producto();
        producto.setSku("CPU-R5-7600");
        producto.setCategoria(cpu);
        when(productoRepository.findByCategoriaCodigo("cpu")).thenReturn(List.of(producto));

        List<ProductoResponse> lista = servicio.listar("cpu", null);

        assertEquals(1, lista.size());
        verify(productoRepository, never()).findAll();
    }
}
