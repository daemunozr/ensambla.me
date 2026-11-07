package cl.duoc.ensamblame.controller;

import cl.duoc.ensamblame.dto.request.PerfilRequest;
import cl.duoc.ensamblame.dto.request.UsuarioRequest;
import cl.duoc.ensamblame.dto.response.UsuarioResponse;
import cl.duoc.ensamblame.security.UsuarioAutenticado;
import cl.duoc.ensamblame.service.UsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Usuarios", description = "Mantenedor de usuarios. Todo requiere rol ADMIN, salvo /me, que puede usar cualquier rol con sesion.")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/api/v1/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @Operation(summary = "Lista los usuarios",
            description = "Requiere rol ADMIN.")
    @ApiResponse(responseCode = "200", description = "Lista de usuarios")
    @GetMapping
    public ResponseEntity<List<UsuarioResponse>> listar() {
        return ResponseEntity.ok(usuarioService.listar());
    }

    // La cuenta en sesion, segun el token. Lo puede usar cualquier rol.
    @Operation(summary = "Cuenta en sesion",
            description = "Devuelve la cuenta a la que pertenece el token. Lo puede usar cualquier rol.")
    @ApiResponse(responseCode = "200", description = "La cuenta en sesion")
    @GetMapping("/me")
    public ResponseEntity<UsuarioResponse> perfil(@AuthenticationPrincipal UsuarioAutenticado actual) {
        return ResponseEntity.ok(usuarioService.obtener(actual.run()));
    }

    // La cuenta en sesion edita sus datos; el RUN y el rol salen del token y no se pueden cambiar.
    @Operation(summary = "Edita la cuenta en sesion",
            description = "Cualquier rol con sesion. Cambia los datos de la cuenta del token, nunca el RUN ni el rol. Para cambiar la contrasena se envian `contrasenaActual` y `contrasenaNueva`. El token sigue siendo valido aunque cambie el correo.")
    @ApiResponse(responseCode = "200", description = "Cuenta actualizada")
    @ApiResponse(responseCode = "400", description = "Datos invalidos o contrasena actual incorrecta")
    @ApiResponse(responseCode = "409", description = "El correo ya lo usa otra cuenta")
    @PutMapping("/me")
    public ResponseEntity<UsuarioResponse> actualizarPerfil(@AuthenticationPrincipal UsuarioAutenticado actual,
            @Valid @RequestBody PerfilRequest request) {
        return ResponseEntity.ok(usuarioService.actualizarPerfil(actual.run(), request));
    }

    @Operation(summary = "Obtiene un usuario",
            description = "Requiere rol ADMIN.")
    @ApiResponse(responseCode = "200", description = "El usuario")
    @ApiResponse(responseCode = "404", description = "No existe el usuario")
    @GetMapping("/{run}")
    public ResponseEntity<UsuarioResponse> obtener(@PathVariable String run) {
        return ResponseEntity.ok(usuarioService.obtener(run));
    }

    @Operation(summary = "Crea un usuario",
            description = "Requiere rol ADMIN. A diferencia del registro publico, aqui se elige el rol.")
    @ApiResponse(responseCode = "201", description = "Usuario creado")
    @ApiResponse(responseCode = "400", description = "Datos invalidos")
    @ApiResponse(responseCode = "409", description = "El RUN o el correo ya existen")
    @PostMapping
    public ResponseEntity<UsuarioResponse> crear(@Valid @RequestBody UsuarioRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(usuarioService.crear(request));
    }

    @Operation(summary = "Edita un usuario",
            description = "Requiere rol ADMIN. El RUN no cambia: manda el de la ruta. Nadie puede cambiar el rol de su propia cuenta.")
    @ApiResponse(responseCode = "200", description = "Usuario actualizado")
    @ApiResponse(responseCode = "400", description = "Datos invalidos")
    @ApiResponse(responseCode = "404", description = "No existe el usuario")
    @ApiResponse(responseCode = "409", description = "El correo ya lo usa otra cuenta, o se intenta cambiar el rol de la propia cuenta")
    @PutMapping("/{run}")
    public ResponseEntity<UsuarioResponse> actualizar(@PathVariable String run,
            @Valid @RequestBody UsuarioRequest request, @AuthenticationPrincipal UsuarioAutenticado actual) {
        return ResponseEntity.ok(usuarioService.actualizar(run, request, actual.run()));
    }

    @Operation(summary = "Elimina un usuario",
            description = "Requiere rol ADMIN. No se puede eliminar la propia cuenta ni un usuario con boletas.")
    @ApiResponse(responseCode = "204", description = "Usuario eliminado")
    @ApiResponse(responseCode = "404", description = "No existe el usuario")
    @ApiResponse(responseCode = "409", description = "El usuario tiene boletas o es la cuenta en sesion")
    @DeleteMapping("/{run}")
    public ResponseEntity<Void> eliminar(@PathVariable String run, @AuthenticationPrincipal UsuarioAutenticado actual) {
        usuarioService.eliminar(run, actual.run());
        return ResponseEntity.noContent().build();
    }
}
