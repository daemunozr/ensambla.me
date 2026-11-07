package cl.duoc.ensamblame.security;

import cl.duoc.ensamblame.exception.TokenInvalidoException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Lee "Authorization: Bearer ..." y, si el token es valido, deja al usuario autenticado para esta
 * peticion. Sin cabecera sigue como anonimo; con un token invalido o vencido responde 401 aunque la
 * ruta sea publica, para que el cliente sepa que debe renovarlo. No es un bean: lo crea
 * SeguridadConfig, para que Spring Boot no lo registre dos veces.
 */
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final String PREFIJO = "Bearer ";

    private final JwtService jwtService;
    private final AuthEntryPoint authEntryPoint;

    public JwtAuthFilter(JwtService jwtService, AuthEntryPoint authEntryPoint) {
        this.jwtService = jwtService;
        this.authEntryPoint = authEntryPoint;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String cabecera = request.getHeader("Authorization");
        if (cabecera == null || !cabecera.startsWith(PREFIJO)) {
            chain.doFilter(request, response);
            return;
        }
        try {
            UsuarioAutenticado usuario = jwtService.leerAcceso(cabecera.substring(PREFIJO.length()));
            var autoridad = new SimpleGrantedAuthority("ROLE_" + usuario.rol().name());
            SecurityContextHolder.getContext()
                    .setAuthentication(new UsernamePasswordAuthenticationToken(usuario, null, List.of(autoridad)));
        } catch (TokenInvalidoException e) {
            SecurityContextHolder.clearContext();
            authEntryPoint.commence(request, response, e);
            return;
        }
        chain.doFilter(request, response);
    }
}
