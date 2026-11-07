package cl.duoc.ensamblame.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

/** Responde 403 con un ErrorResponse cuando el usuario esta autenticado pero su rol no alcanza. */
@Component
public class AccesoDenegadoHandler implements AccessDeniedHandler {

    private final ObjectMapper mapper;

    public AccesoDenegadoHandler(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
            AccessDeniedException excepcion) throws IOException {
        ErrorJson.escribir(mapper, response, 403, "No tienes permiso para usar este recurso.");
    }
}
