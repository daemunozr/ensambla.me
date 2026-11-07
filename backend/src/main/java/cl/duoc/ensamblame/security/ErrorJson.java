package cl.duoc.ensamblame.security;

import cl.duoc.ensamblame.dto.response.ErrorResponse;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.LocalDateTime;
import tools.jackson.databind.ObjectMapper;

/** Escribe un ErrorResponse como JSON. Los errores 401 y 403 ocurren en el filtro, antes de llegar a ResponseEntityHandler. */
final class ErrorJson {

    private ErrorJson() {
    }

    static void escribir(ObjectMapper mapper, HttpServletResponse response, int estado, String mensaje)
            throws IOException {
        response.setStatus(estado);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        mapper.writeValue(response.getOutputStream(), new ErrorResponse(estado, mensaje, null, LocalDateTime.now()));
    }
}
