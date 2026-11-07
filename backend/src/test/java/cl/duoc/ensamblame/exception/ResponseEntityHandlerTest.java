package cl.duoc.ensamblame.exception;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

import cl.duoc.ensamblame.dto.response.ErrorResponse;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.servlet.resource.NoResourceFoundException;

class ResponseEntityHandlerTest {

    private final ResponseEntityHandler handler = new ResponseEntityHandler();

    private ErrorResponse cuerpoDe(ResponseEntity<Object> respuesta) {
        return (ErrorResponse) respuesta.getBody();
    }

    @Test
    void recursoNoEncontradoResponde404ConElMensaje() {
        ResponseEntity<Object> respuesta = handler.handleNoEncontrado(
                new RecursoNoEncontradoException("No existe el producto X-1."));

        assertEquals(HttpStatus.NOT_FOUND, respuesta.getStatusCode());
        assertEquals(404, cuerpoDe(respuesta).estado());
        assertEquals("No existe el producto X-1.", cuerpoDe(respuesta).mensaje());
        assertNotNull(cuerpoDe(respuesta).fecha());
    }

    @Test
    void reglaDeNegocioResponde409() {
        ResponseEntity<Object> respuesta = handler.handleReglaNegocio(
                new ReglaNegocioException("Ya existe un producto con el codigo X-1."));

        assertEquals(HttpStatus.CONFLICT, respuesta.getStatusCode());
        assertEquals("Ya existe un producto con el codigo X-1.", cuerpoDe(respuesta).mensaje());
        assertNull(cuerpoDe(respuesta).errores());
    }

    @Test
    void solicitudInvalidaResponde400() {
        ResponseEntity<Object> respuesta = handler.handleSolicitudInvalida(
                new SolicitudInvalidaException("RUN invalido."));

        assertEquals(HttpStatus.BAD_REQUEST, respuesta.getStatusCode());
        assertEquals("RUN invalido.", cuerpoDe(respuesta).mensaje());
    }

    @Test
    void unaRutaInexistenteResponde404ConElFormatoDeError() {
        ResponseEntity<Object> respuesta = handler.handleNoResourceFoundException(
                new NoResourceFoundException(HttpMethod.GET, "/api/nada", "api/nada"),
                new HttpHeaders(), HttpStatus.NOT_FOUND, null);

        assertEquals(HttpStatus.NOT_FOUND, respuesta.getStatusCode());
        assertEquals(404, cuerpoDe(respuesta).estado());
        assertEquals("No existe la ruta /api/nada.", cuerpoDe(respuesta).mensaje());
    }

    @Test
    void unChoqueDeIntegridadEnLaBaseResponde409SinFiltrarElDetalle() {
        ResponseEntity<Object> respuesta = handler.handleIntegridad(
                new DataIntegrityViolationException("Duplicate entry 'ORD-2026-0004' for key 'PRIMARY'"));

        assertEquals(HttpStatus.CONFLICT, respuesta.getStatusCode());
        assertEquals(409, cuerpoDe(respuesta).estado());
        assertFalse(cuerpoDe(respuesta).mensaje().contains("Duplicate"));
    }

    @Test
    void unaExcepcionCualquieraResponde500SinFiltrarElDetalle() {
        ResponseEntity<Object> respuesta = handler.handleOtros(new IllegalStateException("clave secreta de la base"));

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, respuesta.getStatusCode());
        assertFalse(cuerpoDe(respuesta).mensaje().contains("secreta"));
    }
}
