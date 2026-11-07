package cl.duoc.ensamblame.controller;

import cl.duoc.ensamblame.dto.request.CategoriaRequest;
import cl.duoc.ensamblame.dto.response.CategoriaResponse;
import cl.duoc.ensamblame.service.CategoriaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Categorias", description = "Categorias del catalogo (CPU, RAM, etc.). La lectura es publica; modificar requiere rol ADMIN.")
@RestController
@RequestMapping("/api/v1/categorias")
public class CategoriaController {

    private final CategoriaService categoriaService;

    public CategoriaController(CategoriaService categoriaService) {
        this.categoriaService = categoriaService;
    }

    @Operation(summary = "Lista las categorias",
            description = "Publica.")
    @ApiResponse(responseCode = "200", description = "Lista de categorias")
    @GetMapping
    public ResponseEntity<List<CategoriaResponse>> listar() {
        return ResponseEntity.ok(categoriaService.listar());
    }

    @Operation(summary = "Obtiene una categoria",
            description = "Publica.")
    @ApiResponse(responseCode = "200", description = "La categoria")
    @ApiResponse(responseCode = "404", description = "No existe la categoria")
    @GetMapping("/{codigo}")
    public ResponseEntity<CategoriaResponse> obtener(@PathVariable String codigo) {
        return ResponseEntity.ok(categoriaService.obtener(codigo));
    }

    @Operation(summary = "Crea una categoria",
            description = "Requiere rol ADMIN.")
    @ApiResponse(responseCode = "201", description = "Categoria creada")
    @ApiResponse(responseCode = "400", description = "Datos invalidos")
    @ApiResponse(responseCode = "409", description = "Ya existe una categoria con ese codigo")
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping
    public ResponseEntity<CategoriaResponse> crear(@Valid @RequestBody CategoriaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(categoriaService.crear(request));
    }

    @Operation(summary = "Edita una categoria",
            description = "Requiere rol ADMIN. El codigo no cambia: manda el de la ruta.")
    @ApiResponse(responseCode = "200", description = "Categoria actualizada")
    @ApiResponse(responseCode = "400", description = "Datos invalidos")
    @ApiResponse(responseCode = "404", description = "No existe la categoria")
    @SecurityRequirement(name = "bearerAuth")
    @PutMapping("/{codigo}")
    public ResponseEntity<CategoriaResponse> actualizar(@PathVariable String codigo,
            @Valid @RequestBody CategoriaRequest request) {
        return ResponseEntity.ok(categoriaService.actualizar(codigo, request));
    }

    @Operation(summary = "Elimina una categoria",
            description = "Requiere rol ADMIN. No se puede eliminar si tiene productos.")
    @ApiResponse(responseCode = "204", description = "Categoria eliminada")
    @ApiResponse(responseCode = "404", description = "No existe la categoria")
    @ApiResponse(responseCode = "409", description = "La categoria tiene productos")
    @SecurityRequirement(name = "bearerAuth")
    @DeleteMapping("/{codigo}")
    public ResponseEntity<Void> eliminar(@PathVariable String codigo) {
        categoriaService.eliminar(codigo);
        return ResponseEntity.noContent().build();
    }
}
