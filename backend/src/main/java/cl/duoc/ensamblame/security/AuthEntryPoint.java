package cl.duoc.ensamblame.security;

import cl.duoc.ensamblame.exception.TokenInvalidoException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

/** Responde 401 con un ErrorResponse cuando falta la sesion o el token no sirve. */
@Component
public class AuthEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper mapper;

    public AuthEntryPoint(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
            AuthenticationException excepcion) throws IOException {
        String mensaje = excepcion instanceof TokenInvalidoException
                ? excepcion.getMessage()
                : "Debes iniciar sesion para usar este recurso.";
        ErrorJson.escribir(mapper, response, 401, mensaje);
    }
}
