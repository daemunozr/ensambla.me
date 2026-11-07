package cl.duoc.ensamblame.security;

import cl.duoc.ensamblame.exception.TokenInvalidoException;
import cl.duoc.ensamblame.model.TipoUsuario;
import cl.duoc.ensamblame.model.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Genera y verifica los tokens JWT (firma HS256). Hay dos tipos: el de acceso, de vida corta, que
 * viaja en cada peticion, y el de renovacion, mas largo, que solo sirve para pedir uno nuevo. El
 * claim "tipo" evita que uno se use en lugar del otro.
 */
@Service
public class JwtService {

    private static final int MINIMO_BYTES_SECRETO = 32;
    private static final String ACCESO = "acceso";
    private static final String RENOVACION = "renovacion";

    private final SecretKey clave;
    private final Duration vidaAcceso;
    private final Duration vidaRenovacion;

    public JwtService(@Value("${jwt.secreto}") String secreto,
            @Value("${jwt.acceso-minutos}") long accesoMinutos,
            @Value("${jwt.renovacion-dias}") long renovacionDias) {
        byte[] bytes = secreto.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < MINIMO_BYTES_SECRETO) {
            throw new IllegalStateException("JWT_SECRET debe medir al menos " + MINIMO_BYTES_SECRETO
                    + " caracteres para firmar con HS256.");
        }
        this.clave = Keys.hmacShaKeyFor(bytes);
        this.vidaAcceso = Duration.ofMinutes(accesoMinutos);
        this.vidaRenovacion = Duration.ofDays(renovacionDias);
    }

    public String generarAcceso(Usuario usuario) {
        return generar(usuario, ACCESO, vidaAcceso);
    }

    public String generarRenovacion(Usuario usuario) {
        return generar(usuario, RENOVACION, vidaRenovacion);
    }

    /** Segundos de vida del token de acceso, para que el cliente sepa cuando renovarlo. */
    public long segundosDeAcceso() {
        return vidaAcceso.toSeconds();
    }

    public UsuarioAutenticado leerAcceso(String token) {
        return leer(token, ACCESO);
    }

    public UsuarioAutenticado leerRenovacion(String token) {
        return leer(token, RENOVACION);
    }

    private String generar(Usuario usuario, String tipo, Duration vida) {
        Date ahora = new Date();
        return Jwts.builder()
                .subject(usuario.getCorreo())
                .claim("run", usuario.getRun())
                .claim("rol", usuario.getTipoUsuario().name())
                .claim("tipo", tipo)
                .issuedAt(ahora)
                .expiration(new Date(ahora.getTime() + vida.toMillis()))
                .signWith(clave)
                .compact();
    }

    // Verifica la firma y la fecha de expiracion, y que el token sea del tipo esperado.
    private UsuarioAutenticado leer(String token, String tipoEsperado) {
        try {
            Claims claims = Jwts.parser().verifyWith(clave).build().parseSignedClaims(token).getPayload();
            if (!tipoEsperado.equals(claims.get("tipo", String.class))) {
                throw new TokenInvalidoException("El token no es de tipo " + tipoEsperado + ".");
            }
            return new UsuarioAutenticado(claims.get("run", String.class), claims.getSubject(),
                    TipoUsuario.valueOf(claims.get("rol", String.class)));
        } catch (JwtException | IllegalArgumentException e) {
            // Firma alterada, token vencido o mal formado, o claims que faltan.
            throw new TokenInvalidoException("El token es invalido o esta vencido.");
        }
    }
}
