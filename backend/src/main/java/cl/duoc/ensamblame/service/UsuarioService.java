package cl.duoc.ensamblame.service;

import cl.duoc.ensamblame.dto.request.PerfilRequest;
import cl.duoc.ensamblame.dto.request.UsuarioRequest;
import cl.duoc.ensamblame.dto.response.UsuarioResponse;
import cl.duoc.ensamblame.exception.RecursoNoEncontradoException;
import cl.duoc.ensamblame.exception.ReglaNegocioException;
import cl.duoc.ensamblame.exception.SolicitudInvalidaException;
import cl.duoc.ensamblame.model.Usuario;
import cl.duoc.ensamblame.repository.BoletaRepository;
import cl.duoc.ensamblame.repository.UsuarioRepository;
import cl.duoc.ensamblame.util.ValidadorRun;
import java.util.List;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final BoletaRepository boletaRepository;

    public UsuarioService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder,
            BoletaRepository boletaRepository) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.boletaRepository = boletaRepository;
    }

    public List<UsuarioResponse> listar() {
        return usuarioRepository.findAll().stream().map(this::aResponse).toList();
    }

    public UsuarioResponse obtener(String run) {
        return aResponse(buscar(run));
    }

    public UsuarioResponse crear(UsuarioRequest request) {
        if (!ValidadorRun.esValido(request.run())) {
            throw new SolicitudInvalidaException("RUN invalido: revisa el digito verificador.");
        }
        String run = request.run().toUpperCase();

        if (usuarioRepository.existsById(run)) {
            throw new ReglaNegocioException("Ya existe un usuario con el RUN " + run + ".");
        }
        exigirCorreoLibre(normalizarCorreo(request.correo()), null);

        Usuario usuario = new Usuario();
        usuario.setRun(run);
        copiarDatos(usuario, request);
        return aResponse(usuarioRepository.save(usuario));
    }

    /**
     * El RUN identifica al usuario y no cambia: se ignora el del cuerpo. "runSesion" es la cuenta que
     * edita: nadie puede cambiar su propio rol, para no quedarse (ni dejar al sistema) sin administrador.
     */
    public UsuarioResponse actualizar(String run, UsuarioRequest request, String runSesion) {
        Usuario usuario = buscar(run);
        if (usuario.getRun().equals(runSesion) && usuario.getTipoUsuario() != request.tipoUsuario()) {
            throw new ReglaNegocioException("No puedes cambiar el rol de tu propia cuenta.");
        }
        exigirCorreoLibre(normalizarCorreo(request.correo()), usuario.getRun());

        copiarDatos(usuario, request);
        return aResponse(usuarioRepository.save(usuario));
    }

    /**
     * La cuenta edita sus propios datos. El RUN y el tipo de usuario no cambian. La contrasena solo
     * cambia si viene una nueva, y para eso hay que acertar la actual.
     */
    public UsuarioResponse actualizarPerfil(String run, PerfilRequest request) {
        Usuario usuario = buscar(run);
        String correo = normalizarCorreo(request.correo());
        exigirCorreoLibre(correo, usuario.getRun());

        if (request.contrasenaNueva() != null && !request.contrasenaNueva().isBlank()) {
            if (request.contrasenaActual() == null
                    || !passwordEncoder.matches(request.contrasenaActual(), usuario.getContrasena())) {
                throw new SolicitudInvalidaException("La contrasena actual no es correcta.");
            }
            usuario.setContrasena(passwordEncoder.encode(request.contrasenaNueva()));
        }

        usuario.setNombre(request.nombre());
        usuario.setApellidos(request.apellidos());
        usuario.setCorreo(correo);
        usuario.setFechaNacimiento(request.fechaNacimiento());
        usuario.setRegion(request.region());
        usuario.setComuna(request.comuna());
        usuario.setDireccion(request.direccion());
        return aResponse(usuarioRepository.save(usuario));
    }

    /** No se elimina la cuenta con que se tiene la sesion ("runSesion") ni un usuario con boletas. */
    public void eliminar(String run, String runSesion) {
        Usuario usuario = buscar(run);
        if (usuario.getRun().equals(runSesion)) {
            throw new ReglaNegocioException("No puedes eliminar tu propia cuenta mientras tienes la sesion iniciada.");
        }
        if (boletaRepository.existsByUsuarioRun(usuario.getRun())) {
            throw new ReglaNegocioException("No se puede eliminar el usuario " + run + ": tiene boletas.");
        }
        usuarioRepository.delete(usuario);
    }

    /** Los correos se guardan y se buscan en minusculas, para que "Camila@Gmail.com" sea la misma cuenta. */
    public static String normalizarCorreo(String correo) {
        return correo == null ? null : correo.trim().toLowerCase();
    }

    // El correo puede repetirse solo si es el de la propia cuenta ("runPropio"; null al crear).
    private void exigirCorreoLibre(String correo, String runPropio) {
        usuarioRepository.findByCorreo(correo).ifPresent(otro -> {
            if (!otro.getRun().equals(runPropio)) {
                throw new ReglaNegocioException("Ya existe un usuario con el correo " + correo + ".");
            }
        });
    }

    private Usuario buscar(String run) {
        return usuarioRepository.findById(run.toUpperCase())
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe el usuario " + run + "."));
    }

    // Pasa los datos del request a la entidad (todo menos el RUN). La contrasena se cifra.
    private void copiarDatos(Usuario usuario, UsuarioRequest request) {
        usuario.setNombre(request.nombre());
        usuario.setApellidos(request.apellidos());
        usuario.setCorreo(normalizarCorreo(request.correo()));
        usuario.setContrasena(passwordEncoder.encode(request.contrasena()));
        usuario.setFechaNacimiento(request.fechaNacimiento());
        usuario.setRegion(request.region());
        usuario.setComuna(request.comuna());
        usuario.setDireccion(request.direccion());
        usuario.setTipoUsuario(request.tipoUsuario());
    }

    // La contrasena no se incluye en la respuesta.
    private UsuarioResponse aResponse(Usuario u) {
        return new UsuarioResponse(u.getRun(), u.getNombre(), u.getApellidos(), u.getCorreo(),
                u.getFechaNacimiento(), u.getRegion(), u.getComuna(), u.getDireccion(), u.getTipoUsuario());
    }
}
