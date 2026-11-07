package cl.duoc.ensamblame.exception;

import cl.duoc.ensamblame.dto.response.ErrorResponse;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/**
 * Convierte todas las excepciones en un ResponseEntity con un ErrorResponse, para que los
 * controladores no necesiten try/catch. Extiende ResponseEntityExceptionHandler, que ya
 * conoce las excepciones de Spring MVC; aqui se personalizan dos y se agregan las propias.
 */
@RestControllerAdvice
public class ResponseEntityHandler extends ResponseEntityExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ResponseEntityHandler.class);

    /** Fallo de @Valid en un request: 400 con el mensaje de cada campo. */
    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex,
            HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        Map<String, String> errores = new LinkedHashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            errores.putIfAbsent(error.getField(), error.getDefaultMessage());
        }
        return crear(HttpStatus.BAD_REQUEST, "Hay campos invalidos.", errores);
    }

    /** JSON mal formado o con un valor imposible (por ejemplo, un tipo de usuario inexistente): 400. */
    @Override
    protected ResponseEntity<Object> handleHttpMessageNotReadable(HttpMessageNotReadableException ex,
            HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        return crear(HttpStatus.BAD_REQUEST, "El cuerpo de la solicitud no es valido.", null);
    }

    /** Ruta que no existe (por ejemplo /api/nada): 404 con el mismo formato que los demas errores. */
    @Override
    protected ResponseEntity<Object> handleNoResourceFoundException(NoResourceFoundException ex,
            HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        return crear(HttpStatus.NOT_FOUND, "No existe la ruta /" + ex.getResourcePath() + ".", null);
    }

    @ExceptionHandler(RecursoNoEncontradoException.class)
    public ResponseEntity<Object> handleNoEncontrado(RecursoNoEncontradoException ex) {
        return crear(HttpStatus.NOT_FOUND, ex.getMessage(), null);
    }

    @ExceptionHandler(ReglaNegocioException.class)
    public ResponseEntity<Object> handleReglaNegocio(ReglaNegocioException ex) {
        return crear(HttpStatus.CONFLICT, ex.getMessage(), null);
    }

    @ExceptionHandler(SolicitudInvalidaException.class)
    public ResponseEntity<Object> handleSolicitudInvalida(SolicitudInvalidaException ex) {
        return crear(HttpStatus.BAD_REQUEST, ex.getMessage(), null);
    }

    /** Credenciales incorrectas o token invalido lanzados desde un controlador o servicio: 401. */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<Object> handleNoAutenticado(AuthenticationException ex) {
        return crear(HttpStatus.UNAUTHORIZED, ex.getMessage(), null);
    }

    /**
     * La base rechazo la escritura por una restriccion (clave o correo repetidos). Ocurre cuando dos
     * peticiones simultaneas pasan las validaciones a la vez, como dos compras que piden el mismo
     * numero de boleta: 409, para que el cliente reintente.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Object> handleIntegridad(DataIntegrityViolationException ex) {
        log.warn("Escritura rechazada por la base: {}", ex.getMostSpecificCause().getMessage());
        return crear(HttpStatus.CONFLICT, "No se pudo guardar: los datos chocan con otro registro. Intenta de nuevo.", null);
    }

    /** Cualquier otro error: se registra en el log y el cliente solo recibe un mensaje general. */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> handleOtros(Exception ex) {
        log.error("Error no controlado", ex);
        return crear(HttpStatus.INTERNAL_SERVER_ERROR, "Ocurrio un error en el servidor.", null);
    }

    private ResponseEntity<Object> crear(HttpStatus estado, String mensaje, Map<String, String> errores) {
        ErrorResponse cuerpo = new ErrorResponse(estado.value(), mensaje, errores, LocalDateTime.now());
        return ResponseEntity.status(estado).body(cuerpo);
    }
}
