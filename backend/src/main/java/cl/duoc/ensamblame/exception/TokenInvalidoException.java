package cl.duoc.ensamblame.exception;

import org.springframework.security.core.AuthenticationException;

/** Se lanza cuando falta una sesion valida o el token esta alterado, vencido o es del tipo equivocado (responde 401). */
public class TokenInvalidoException extends AuthenticationException {

    public TokenInvalidoException(String mensaje) {
        super(mensaje);
    }
}
