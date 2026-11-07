package cl.duoc.ensamblame.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import cl.duoc.ensamblame.exception.TokenInvalidoException;
import cl.duoc.ensamblame.model.TipoUsuario;
import cl.duoc.ensamblame.model.Usuario;
import org.junit.jupiter.api.Test;

class JwtServiceTest {

    private static final String SECRETO = "secreto-de-prueba-con-mas-de-treinta-y-dos-caracteres";

    private final JwtService servicio = new JwtService(SECRETO, 15, 7);

    private Usuario camila() {
        Usuario usuario = new Usuario();
        usuario.setRun("123456785");
        usuario.setCorreo("camila@gmail.com");
        usuario.setTipoUsuario(TipoUsuario.CLIENTE);
        return usuario;
    }

    @Test
    void elTokenDeAccesoTraeQuienEsYSuRol() {
        String token = servicio.generarAcceso(camila());

        UsuarioAutenticado quien = servicio.leerAcceso(token);

        assertEquals("123456785", quien.run());
        assertEquals("camila@gmail.com", quien.correo());
        assertEquals(TipoUsuario.CLIENTE, quien.rol());
    }

    @Test
    void elTokenDeRenovacionNoSirveComoTokenDeAcceso() {
        String renovacion = servicio.generarRenovacion(camila());

        assertThrows(TokenInvalidoException.class, () -> servicio.leerAcceso(renovacion));
    }

    @Test
    void elTokenDeAccesoNoSirveParaRenovar() {
        String acceso = servicio.generarAcceso(camila());

        assertThrows(TokenInvalidoException.class, () -> servicio.leerRenovacion(acceso));
    }

    @Test
    void unTokenVencidoSeRechaza() {
        JwtService yaVencido = new JwtService(SECRETO, -1, 7);
        String token = yaVencido.generarAcceso(camila());

        assertThrows(TokenInvalidoException.class, () -> servicio.leerAcceso(token));
    }

    @Test
    void unTokenConElContenidoAlteradoSeRechaza() {
        String token = servicio.generarAcceso(camila());
        // Cambia un caracter del contenido (segunda parte del token); la firma ya no coincide.
        int medio = token.indexOf('.') + 5;
        char otro = token.charAt(medio) == 'a' ? 'b' : 'a';
        String alterado = token.substring(0, medio) + otro + token.substring(medio + 1);

        assertThrows(TokenInvalidoException.class, () -> servicio.leerAcceso(alterado));
    }

    @Test
    void unTokenFirmadoConOtraClaveSeRechaza() {
        JwtService ajeno = new JwtService("otro-secreto-distinto-con-mas-de-treinta-y-dos-caracteres", 15, 7);
        String token = ajeno.generarAcceso(camila());

        assertThrows(TokenInvalidoException.class, () -> servicio.leerAcceso(token));
    }

    @Test
    void unTextoQueNoEsUnTokenSeRechaza() {
        assertThrows(TokenInvalidoException.class, () -> servicio.leerAcceso("esto-no-es-un-token"));
        assertThrows(TokenInvalidoException.class, () -> servicio.leerAcceso(""));
    }

    @Test
    void unSecretoCortoImpideArrancar() {
        assertThrows(IllegalStateException.class, () -> new JwtService("corto", 15, 7));
    }

    @Test
    void informaLosSegundosDeVidaDelTokenDeAcceso() {
        assertEquals(900, servicio.segundosDeAcceso());
    }
}
