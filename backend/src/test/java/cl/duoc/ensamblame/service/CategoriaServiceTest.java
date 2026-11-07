package cl.duoc.ensamblame.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import cl.duoc.ensamblame.dto.request.CategoriaRequest;
import cl.duoc.ensamblame.dto.response.CategoriaResponse;
import cl.duoc.ensamblame.exception.RecursoNoEncontradoException;
import cl.duoc.ensamblame.exception.ReglaNegocioException;
import cl.duoc.ensamblame.model.Categoria;
import cl.duoc.ensamblame.repository.CategoriaRepository;
import cl.duoc.ensamblame.repository.ProductoRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CategoriaServiceTest {

    @Mock
    private CategoriaRepository categoriaRepository;

    @Mock
    private ProductoRepository productoRepository;

    private CategoriaService servicio;

    @BeforeEach
    void preparar() {
        servicio = new CategoriaService(categoriaRepository, productoRepository);
    }

    @Test
    void listarDevuelveTodasLasCategorias() {
        when(categoriaRepository.findAll()).thenReturn(List.of(new Categoria("cpu", "Procesadores (CPU)", 1),
                new Categoria("monitores", "Monitores", null)));

        List<CategoriaResponse> respuesta = servicio.listar();

        assertEquals(2, respuesta.size());
        assertEquals("cpu", respuesta.get(0).codigo());
        assertEquals(1, respuesta.get(0).orden());
    }

    @Test
    void crearGuardaLaCategoriaYDevuelveSuResponse() {
        when(categoriaRepository.existsById("monitores")).thenReturn(false);
        // save devuelve el mismo objeto que recibe.
        when(categoriaRepository.save(any(Categoria.class))).thenAnswer(llamada -> llamada.getArgument(0));

        CategoriaResponse respuesta = servicio.crear(new CategoriaRequest("monitores", "Monitores", null));

        assertEquals("monitores", respuesta.codigo());
        assertEquals("Monitores", respuesta.nombre());
    }

    @Test
    void crearConUnCodigoRepetidoLanzaConflictoYNoGuarda() {
        when(categoriaRepository.existsById("cpu")).thenReturn(true);

        assertThrows(ReglaNegocioException.class, () -> servicio.crear(new CategoriaRequest("cpu", "Otra", null)));

        verify(categoriaRepository, never()).save(any());
    }

    @Test
    void actualizarCambiaElNombreYConservaElCodigoDeLaRuta() {
        when(categoriaRepository.findById("cpu")).thenReturn(Optional.of(new Categoria("cpu", "Procesadores (CPU)", 1)));
        when(categoriaRepository.save(any(Categoria.class))).thenAnswer(llamada -> llamada.getArgument(0));

        CategoriaResponse respuesta = servicio.actualizar("cpu", new CategoriaRequest("otro-codigo", "CPU", 1));

        assertEquals("cpu", respuesta.codigo());
        assertEquals("CPU", respuesta.nombre());
    }

    @Test
    void actualizarUnaCategoriaInexistenteLanzaNoEncontrado() {
        when(categoriaRepository.findById("nada")).thenReturn(Optional.empty());

        assertThrows(RecursoNoEncontradoException.class,
                () -> servicio.actualizar("nada", new CategoriaRequest("nada", "Nada", null)));
    }

    @Test
    void eliminarUnaCategoriaSinProductosNiPasoDelAsistenteLaBorra() {
        Categoria monitores = new Categoria("monitores", "Monitores", null);
        when(categoriaRepository.findById("monitores")).thenReturn(Optional.of(monitores));
        when(productoRepository.existsByCategoriaCodigo("monitores")).thenReturn(false);

        servicio.eliminar("monitores");

        verify(categoriaRepository).delete(monitores);
    }

    @Test
    void eliminarUnaCategoriaConProductosLanzaConflictoYNoLaBorra() {
        when(categoriaRepository.findById("monitores")).thenReturn(Optional.of(new Categoria("monitores", "Monitores", null)));
        when(productoRepository.existsByCategoriaCodigo("monitores")).thenReturn(true);

        assertThrows(ReglaNegocioException.class, () -> servicio.eliminar("monitores"));

        verify(categoriaRepository, never()).delete(any());
    }

    @Test
    void unPasoDelAsistenteNoSeEliminaAunqueNoTengaProductos() {
        when(categoriaRepository.findById("cpu")).thenReturn(Optional.of(new Categoria("cpu", "Procesadores (CPU)", 1)));

        ReglaNegocioException error = assertThrows(ReglaNegocioException.class, () -> servicio.eliminar("cpu"));

        assertTrue(error.getMessage().contains("paso 1 del asistente"));
        verify(categoriaRepository, never()).delete(any());
    }

    @Test
    void eliminarUnaCategoriaInexistenteLanzaNoEncontrado() {
        when(categoriaRepository.findById("nada")).thenReturn(Optional.empty());

        assertThrows(RecursoNoEncontradoException.class, () -> servicio.eliminar("nada"));
    }
}
