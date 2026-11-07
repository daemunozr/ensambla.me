package cl.duoc.ensamblame.service;

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
        if (usuarioRepository.findByCorreo(request.correo()).isPresent()) {
            throw new ReglaNegocioException("Ya existe un usuario con el correo " + request.correo() + ".");
        }

        Usuario usuario = new Usuario();
        usuario.setRun(run);
        copiarDatos(usuario, request);
        return aResponse(usuarioRepository.save(usuario));
    }

    /** El RUN identifica al usuario y no cambia: se ignora el del cuerpo. */
    public UsuarioResponse actualizar(String run, UsuarioRequest request) {
        Usuario usuario = buscar(run);

        // El correo puede repetirse solo si es el del propio usuario.
        usuarioRepository.findByCorreo(request.correo()).ifPresent(otro -> {
            if (!otro.getRun().equals(usuario.getRun())) {
                throw new ReglaNegocioException("Ya existe un usuario con el correo " + request.correo() + ".");
            }
        });

        copiarDatos(usuario, request);
        return aResponse(usuarioRepository.save(usuario));
    }

    public void eliminar(String run) {
        Usuario usuario = buscar(run);
        if (boletaRepository.existsByUsuarioRun(usuario.getRun())) {
            throw new ReglaNegocioException("No se puede eliminar el usuario " + run + ": tiene boletas.");
        }
        usuarioRepository.delete(usuario);
    }

    private Usuario buscar(String run) {
        return usuarioRepository.findById(run.toUpperCase())
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe el usuario " + run + "."));
    }

    // Pasa los datos del request a la entidad (todo menos el RUN). La contrasena se cifra.
    private void copiarDatos(Usuario usuario, UsuarioRequest request) {
        usuario.setNombre(request.nombre());
        usuario.setApellidos(request.apellidos());
        usuario.setCorreo(request.correo());
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
