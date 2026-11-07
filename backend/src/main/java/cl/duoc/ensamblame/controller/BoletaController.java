package cl.duoc.ensamblame.controller;

import cl.duoc.ensamblame.config.OpenApiConfig;
import cl.duoc.ensamblame.dto.request.BoletaRequest;
import cl.duoc.ensamblame.dto.response.BoletaResponse;
import cl.duoc.ensamblame.exception.TokenInvalidoException;
import cl.duoc.ensamblame.model.TipoUsuario;
import cl.duoc.ensamblame.security.UsuarioAutenticado;
import cl.duoc.ensamblame.service.BoletaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.extensions.Extension;
import io.swagger.v3.oas.annotations.extensions.ExtensionProperty;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Una boleta se registra y se consulta, pero no se edita ni se elimina. */
@Tag(name = "Boletas", description = "Compras. Comprar no exige sesion; consultar boletas si.")
@RestController
@RequestMapping("/api/v1/boletas")
public class BoletaController {

    private final BoletaService boletaService;

    public BoletaController(BoletaService boletaService) {
        this.boletaService = boletaService;
    }

    // GET /api/v1/boletas   o   GET /api/v1/boletas?usuario=123456785 (solo el personal puede filtrar)
    // Un cliente solo ve sus boletas: se ignora el filtro y se usa su RUN.
    @Operation(summary = "Lista las boletas",
            description = "ADMIN y LOGISTICA ven todas (y pueden filtrar con `usuario`); un CLIENTE solo ve las suyas e ignora el filtro. De la mas reciente a la mas antigua.")
    @ApiResponse(responseCode = "200", description = "Lista de boletas")
    @SecurityRequirement(name = "bearerAuth")
    @GetMapping
    public ResponseEntity<List<BoletaResponse>> listar(@Parameter(description = "RUN de la cuenta; solo lo usa el personal (ADMIN y LOGISTICA)") @RequestParam(required = false) String usuario,
            @AuthenticationPrincipal UsuarioAutenticado actual) {
        String restringidoA = restringirA(actual);
        return ResponseEntity.ok(boletaService.listar(restringidoA != null ? restringidoA : usuario));
    }

    @Operation(summary = "Obtiene una boleta",
            description = "ADMIN y LOGISTICA ven cualquiera. Un CLIENTE solo ve las suyas: la de otra cuenta o la de un invitado responde 404.")
    @ApiResponse(responseCode = "200", description = "La boleta con su detalle, neto, IVA y total")
    @ApiResponse(responseCode = "404", description = "No existe la boleta (o no es del cliente)")
    @SecurityRequirement(name = "bearerAuth")
    @GetMapping("/{numero}")
    public ResponseEntity<BoletaResponse> obtener(@PathVariable String numero,
            @AuthenticationPrincipal UsuarioAutenticado actual) {
        return ResponseEntity.ok(boletaService.obtener(numero, restringirA(actual)));
    }

    // Sin token (actual == null) la compra es de invitado; con token queda a nombre de la cuenta.
    @Operation(summary = "Registra una compra",
            description = "Publica. Con token, la boleta queda a nombre de la cuenta; sin token, es de invitado. Los precios y el envio los calcula el servidor: congela el precio vigente de cada producto, descuenta el stock y numera la boleta ORD-AAAA-NNNN. Todo ocurre en una sola transaccion.",
            extensions = @Extension(properties = @ExtensionProperty(name = OpenApiConfig.TOKEN_OPCIONAL, value = "true")))
    @ApiResponse(responseCode = "201", description = "Boleta creada")
    @ApiResponse(responseCode = "400", description = "Datos invalidos")
    @ApiResponse(responseCode = "401", description = "Se envio un token invalido o vencido")
    @ApiResponse(responseCode = "404", description = "No existe un producto")
    @ApiResponse(responseCode = "409", description = "Sin stock suficiente")
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping
    public ResponseEntity<BoletaResponse> crear(@Valid @RequestBody BoletaRequest request,
            @AuthenticationPrincipal UsuarioAutenticado actual) {
        String run = actual != null ? actual.run() : null;
        return ResponseEntity.status(HttpStatus.CREATED).body(boletaService.crear(request, run));
    }

    // RUN al que se limita la consulta: el del cliente, o null si es personal (ve todo).
    // La seguridad ya exige sesion en estas rutas; si faltara, se corta aqui en vez de mostrar todo.
    private String restringirA(UsuarioAutenticado actual) {
        if (actual == null) {
            throw new TokenInvalidoException("Debes iniciar sesion para usar este recurso.");
        }
        return actual.rol() == TipoUsuario.CLIENTE ? actual.run() : null;
    }
}
