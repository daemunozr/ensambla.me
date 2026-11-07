package cl.duoc.ensamblame.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import cl.duoc.ensamblame.dto.request.BoletaRequest;
import cl.duoc.ensamblame.dto.response.BoletaResponse;
import cl.duoc.ensamblame.dto.response.DetalleBoletaResponse;
import cl.duoc.ensamblame.exception.RecursoNoEncontradoException;
import cl.duoc.ensamblame.exception.ReglaNegocioException;
import cl.duoc.ensamblame.exception.ResponseEntityHandler;
import cl.duoc.ensamblame.model.TipoEntrega;
import cl.duoc.ensamblame.service.BoletaService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/** Controlador y ResponseEntityHandler sin base de datos: el servicio es un mock. */
@ExtendWith(MockitoExtension.class)
class BoletaControllerTest {

    @Mock
    private BoletaService boletaService;

    private MockMvc mockMvc;

    private static final String JSON_VALIDO = """
            {"nombre": "Camila Soto Vera", "correo": "camila@gmail.com", "direccion": "Irarrazaval 2550",
             "comuna": "RM-04", "entrega": "DOMICILIO", "medioPago": "Tarjeta terminada en 4242",
             "lineas": [{"sku": "PER-KB-MECH", "cantidad": 1}]}
            """;

    @BeforeEach
    void preparar() {
        mockMvc = MockMvcBuilders.standaloneSetup(new BoletaController(boletaService))
                .setControllerAdvice(new ResponseEntityHandler())
                .build();
    }

    private BoletaResponse boleta() {
        DetalleBoletaResponse detalle = new DetalleBoletaResponse("PER-KB-MECH", "Teclado mecanico", 1,
                new BigDecimal("34990.00"), new BigDecimal("34990.00"));
        return new BoletaResponse("ORD-2026-0004", null, LocalDate.of(2026, 11, 7), "Camila Soto Vera",
                "camila@gmail.com", "Irarrazaval 2550", "RM-04", TipoEntrega.DOMICILIO,
                "Tarjeta terminada en 4242", List.of(detalle), new BigDecimal("34990.00"),
                new BigDecimal("4990.00"), new BigDecimal("39980.00"), new BigDecimal("33597.00"),
                new BigDecimal("6383.00"));
    }

    @Test
    void crearConDatosValidosResponde201ConLaBoleta() throws Exception {
        when(boletaService.crear(any(BoletaRequest.class))).thenReturn(boleta());

        mockMvc.perform(post("/api/v1/boletas").contentType(MediaType.APPLICATION_JSON).content(JSON_VALIDO))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.numero").value("ORD-2026-0004"))
                .andExpect(jsonPath("$.total").value(39980.00))
                .andExpect(jsonPath("$.detalles[0].sku").value("PER-KB-MECH"));
    }

    @Test
    void crearSinLineasNiEntregaResponde400ConElMensajeDeCadaCampo() throws Exception {
        String invalido = """
                {"nombre": "Camila", "correo": "camila@gmail.com", "direccion": "Irarrazaval 2550",
                 "comuna": "RM-04", "medioPago": "Tarjeta", "lineas": []}
                """;

        mockMvc.perform(post("/api/v1/boletas").contentType(MediaType.APPLICATION_JSON).content(invalido))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores.lineas").exists())
                .andExpect(jsonPath("$.errores.entrega").exists());
    }

    @Test
    void crearConUnaCantidadMenorAUnoResponde400() throws Exception {
        String invalido = JSON_VALIDO.replace("\"cantidad\": 1", "\"cantidad\": 0");

        mockMvc.perform(post("/api/v1/boletas").contentType(MediaType.APPLICATION_JSON).content(invalido))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores['lineas[0].cantidad']").exists());
    }

    @Test
    void crearConUnaEntregaDesconocidaResponde400() throws Exception {
        String invalido = JSON_VALIDO.replace("DOMICILIO", "VOLANDO");

        mockMvc.perform(post("/api/v1/boletas").contentType(MediaType.APPLICATION_JSON).content(invalido))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crearSinStockResponde409() throws Exception {
        when(boletaService.crear(any(BoletaRequest.class)))
                .thenThrow(new ReglaNegocioException("Sin stock suficiente: Teclado mecanico (quedan 0)."));

        mockMvc.perform(post("/api/v1/boletas").contentType(MediaType.APPLICATION_JSON).content(JSON_VALIDO))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.estado").value(409));
    }

    @Test
    void obtenerUnaBoletaInexistenteResponde404() throws Exception {
        when(boletaService.obtener("ORD-2026-9999"))
                .thenThrow(new RecursoNoEncontradoException("No existe la boleta ORD-2026-9999."));

        mockMvc.perform(get("/api/v1/boletas/ORD-2026-9999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.mensaje").value("No existe la boleta ORD-2026-9999."));
    }

    @Test
    void listarConElFiltroDeUsuarioResponde200() throws Exception {
        when(boletaService.listar("123456785")).thenReturn(List.of(boleta()));

        mockMvc.perform(get("/api/v1/boletas").param("usuario", "123456785"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].numero").value("ORD-2026-0004"));
    }
}
