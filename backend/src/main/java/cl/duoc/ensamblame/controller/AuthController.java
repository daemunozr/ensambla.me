package cl.duoc.ensamblame.controller;

import cl.duoc.ensamblame.dto.request.LoginRequest;
import cl.duoc.ensamblame.dto.request.RefreshRequest;
import cl.duoc.ensamblame.dto.request.RegistroRequest;
import cl.duoc.ensamblame.dto.response.TokenResponse;
import cl.duoc.ensamblame.dto.response.UsuarioResponse;
import cl.duoc.ensamblame.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Rutas publicas para entrar al sistema: iniciar sesion, registrarse y renovar el token. */
@Tag(name = "Autenticacion", description = "Iniciar sesion, registrarse y renovar el token. Rutas publicas.")
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @Operation(summary = "Inicia sesion",
            description = "Valida el correo y la contrasena y entrega un token de acceso (15 min) y uno de renovacion (7 dias). El error es el mismo si el correo no existe o la contrasena es incorrecta.")
    @ApiResponse(responseCode = "200", description = "Tokens y datos de la sesion")
    @ApiResponse(responseCode = "400", description = "Faltan el correo o la contrasena")
    @ApiResponse(responseCode = "401", description = "Correo o contrasena incorrectos")
    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @Operation(summary = "Registra un cliente",
            description = "Crea una cuenta con rol CLIENTE. El rol no se puede elegir: los demas roles los crea un administrador en /usuarios.")
    @ApiResponse(responseCode = "201", description = "Cuenta creada")
    @ApiResponse(responseCode = "400", description = "Datos invalidos (RUN, dominio del correo, contrasena de 4 a 10 caracteres...)")
    @ApiResponse(responseCode = "409", description = "El RUN o el correo ya estan registrados")
    @PostMapping("/registro")
    public ResponseEntity<UsuarioResponse> registro(@Valid @RequestBody RegistroRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.registro(request));
    }

    @Operation(summary = "Renueva los tokens",
            description = "Canjea un token de renovacion por un token de acceso nuevo y otro de renovacion. El rol se lee de nuevo de la base. Un token de acceso no sirve aqui.")
    @ApiResponse(responseCode = "200", description = "Tokens nuevos")
    @ApiResponse(responseCode = "400", description = "Falta el token de renovacion")
    @ApiResponse(responseCode = "401", description = "El token es invalido, esta vencido o no es de renovacion")
    @PostMapping("/refresh")
    public ResponseEntity<TokenResponse> refresh(@Valid @RequestBody RefreshRequest request) {
        return ResponseEntity.ok(authService.refresh(request));
    }
}
