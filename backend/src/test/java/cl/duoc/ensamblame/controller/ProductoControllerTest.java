package cl.duoc.ensamblame.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import cl.duoc.ensamblame.dto.request.ProductoRequest;
import cl.duoc.ensamblame.dto.response.ProductoResponse;
import cl.duoc.ensamblame.exception.RecursoNoEncontradoException;
import cl.duoc.ensamblame.exception.ReglaNegocioException;
import cl.duoc.ensamblame.exception.ResponseEntityHandler;
import cl.duoc.ensamblame.service.ProductoService;
import java.math.BigDecimal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/**
 * Prueba el controlador junto con ResponseEntityHandler, sin base de datos: el servicio es un
 * mock y MockMvc simula las peticiones HTTP.
 */
@ExtendWith(MockitoExtension.class)
class ProductoControllerTest {

    @Mock
    private ProductoService productoService;

    private MockMvc mockMvc;

    private static final String JSON_VALIDO = """
            {"sku": "CPU-R5-7600", "nombre": "AMD Ryzen 5 7600", "precio": 249990, "stock": 18, "categoria": "cpu"}
            """;

    @BeforeEach
    void preparar() {
        mockMvc = MockMvcBuilders.standaloneSetup(new ProductoController(productoService))
                .setControllerAdvice(new ResponseEntityHandler())
                .build();
    }

    @Test
    void crearConDatosValidosResponde201() throws Exception {
        ProductoResponse creado = new ProductoResponse("CPU-R5-7600", "AMD Ryzen 5 7600", null,
                new BigDecimal("249990"), null, 18, null, null, null, "cpu", "Procesadores (CPU)");
        when(productoService.crear(any(ProductoRequest.class))).thenReturn(creado);

        mockMvc.perform(post("/api/v1/productos").contentType(MediaType.APPLICATION_JSON).content(JSON_VALIDO))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.sku").value("CPU-R5-7600"))
                .andExpect(jsonPath("$.nombreCategoria").value("Procesadores (CPU)"));
    }

    @Test
    void crearConCamposInvalidosResponde400ConElMensajeDeCadaCampo() throws Exception {
        String invalido = """
                {"sku": "AB", "nombre": "", "precio": -5, "stock": 3, "descuento": 95, "categoria": "cpu"}
                """;

        mockMvc.perform(post("/api/v1/productos").contentType(MediaType.APPLICATION_JSON).content(invalido))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.estado").value(400))
                .andExpect(jsonPath("$.errores.sku").exists())
                .andExpect(jsonPath("$.errores.nombre").exists())
                .andExpect(jsonPath("$.errores.precio").value("El precio no puede ser negativo."))
                .andExpect(jsonPath("$.errores.descuento").exists());
    }

    @Test
    void crearConJsonMalFormadoResponde400() throws Exception {
        mockMvc.perform(post("/api/v1/productos").contentType(MediaType.APPLICATION_JSON).content("{no es json"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensaje").value("El cuerpo de la solicitud no es valido."));
    }

    @Test
    void crearConUnSkuRepetidoResponde409() throws Exception {
        when(productoService.crear(any(ProductoRequest.class)))
                .thenThrow(new ReglaNegocioException("Ya existe un producto con el codigo CPU-R5-7600."));

        mockMvc.perform(post("/api/v1/productos").contentType(MediaType.APPLICATION_JSON).content(JSON_VALIDO))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.mensaje").value("Ya existe un producto con el codigo CPU-R5-7600."));
    }

    @Test
    void consultarUnProductoInexistenteResponde404() throws Exception {
        when(productoService.obtener("NO-EXISTE")).thenThrow(new RecursoNoEncontradoException("No existe el producto NO-EXISTE."));

        mockMvc.perform(get("/api/v1/productos/NO-EXISTE"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.estado").value(404));
    }

    @Test
    void eliminarResponde204SinCuerpo() throws Exception {
        mockMvc.perform(delete("/api/v1/productos/CPU-R5-7600"))
                .andExpect(status().isNoContent());
    }
}
