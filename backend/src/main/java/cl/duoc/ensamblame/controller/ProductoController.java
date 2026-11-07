package cl.duoc.ensamblame.controller;

import cl.duoc.ensamblame.dto.request.ProductoRequest;
import cl.duoc.ensamblame.dto.response.ProductoResponse;
import cl.duoc.ensamblame.service.ProductoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Productos", description = "Catalogo de productos. La lectura es publica; modificar requiere rol ADMIN.")
@RestController
@RequestMapping("/api/v1/productos")
public class ProductoController {

    private final ProductoService productoService;

    public ProductoController(ProductoService productoService) {
        this.productoService = productoService;
    }

    // GET /api/v1/productos?categoria=cpu   o   GET /api/v1/productos?q=ryzen
    @Operation(summary = "Lista los productos",
            description = "Publica. Sin filtros devuelve todos; con `categoria` o con `q` (texto en el nombre o el SKU) filtra.")
    @ApiResponse(responseCode = "200", description = "Lista de productos")
    @GetMapping
    public ResponseEntity<List<ProductoResponse>> listar(
            @Parameter(description = "Codigo de la categoria, por ejemplo cpu") @RequestParam(required = false) String categoria,
            @Parameter(description = "Texto a buscar en el nombre o el SKU") @RequestParam(required = false) String q) {
        return ResponseEntity.ok(productoService.listar(categoria, q));
    }

    @Operation(summary = "Obtiene un producto",
            description = "Publica.")
    @ApiResponse(responseCode = "200", description = "El producto")
    @ApiResponse(responseCode = "404", description = "No existe el producto")
    @GetMapping("/{sku}")
    public ResponseEntity<ProductoResponse> obtener(@PathVariable String sku) {
        return ResponseEntity.ok(productoService.obtener(sku));
    }

    @Operation(summary = "Crea un producto",
            description = "Requiere rol ADMIN. La categoria debe existir.")
    @ApiResponse(responseCode = "201", description = "Producto creado")
    @ApiResponse(responseCode = "400", description = "Datos invalidos")
    @ApiResponse(responseCode = "404", description = "No existe la categoria")
    @ApiResponse(responseCode = "409", description = "Ya existe un producto con ese SKU")
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping
    public ResponseEntity<ProductoResponse> crear(@Valid @RequestBody ProductoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productoService.crear(request));
    }

    @Operation(summary = "Edita un producto",
            description = "Requiere rol ADMIN. El SKU no cambia: manda el de la ruta.")
    @ApiResponse(responseCode = "200", description = "Producto actualizado")
    @ApiResponse(responseCode = "400", description = "Datos invalidos")
    @ApiResponse(responseCode = "404", description = "No existe el producto o la categoria")
    @SecurityRequirement(name = "bearerAuth")
    @PutMapping("/{sku}")
    public ResponseEntity<ProductoResponse> actualizar(@PathVariable String sku,
            @Valid @RequestBody ProductoRequest request) {
        return ResponseEntity.ok(productoService.actualizar(sku, request));
    }

    @Operation(summary = "Elimina un producto",
            description = "Requiere rol ADMIN. No se puede eliminar si figura en alguna boleta.")
    @ApiResponse(responseCode = "204", description = "Producto eliminado")
    @ApiResponse(responseCode = "404", description = "No existe el producto")
    @ApiResponse(responseCode = "409", description = "El producto figura en boletas")
    @SecurityRequirement(name = "bearerAuth")
    @DeleteMapping("/{sku}")
    public ResponseEntity<Void> eliminar(@PathVariable String sku) {
        productoService.eliminar(sku);
        return ResponseEntity.noContent().build();
    }
}
