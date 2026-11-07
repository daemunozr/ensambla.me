package cl.duoc.ensamblame.service;

import cl.duoc.ensamblame.dto.request.ProductoRequest;
import cl.duoc.ensamblame.dto.response.ProductoResponse;
import cl.duoc.ensamblame.exception.RecursoNoEncontradoException;
import cl.duoc.ensamblame.exception.ReglaNegocioException;
import cl.duoc.ensamblame.model.Categoria;
import cl.duoc.ensamblame.model.Producto;
import cl.duoc.ensamblame.repository.BoletaRepository;
import cl.duoc.ensamblame.repository.CategoriaRepository;
import cl.duoc.ensamblame.repository.ProductoRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ProductoService {

    private final ProductoRepository productoRepository;
    private final CategoriaRepository categoriaRepository;
    private final BoletaRepository boletaRepository;

    public ProductoService(ProductoRepository productoRepository, CategoriaRepository categoriaRepository,
            BoletaRepository boletaRepository) {
        this.productoRepository = productoRepository;
        this.categoriaRepository = categoriaRepository;
        this.boletaRepository = boletaRepository;
    }

    /** Sin filtros devuelve todos; con "categoria" o con "q" (texto en nombre o SKU) filtra. */
    public List<ProductoResponse> listar(String categoria, String q) {
        List<Producto> productos;
        if (categoria != null && !categoria.isBlank()) {
            productos = productoRepository.findByCategoriaCodigo(categoria);
        } else if (q != null && !q.isBlank()) {
            productos = productoRepository.findByNombreContainingIgnoreCaseOrSkuContainingIgnoreCase(q, q);
        } else {
            productos = productoRepository.findAll();
        }
        return productos.stream().map(this::aResponse).toList();
    }

    public ProductoResponse obtener(String sku) {
        return aResponse(buscar(sku));
    }

    public ProductoResponse crear(ProductoRequest request) {
        if (productoRepository.existsById(request.sku())) {
            throw new ReglaNegocioException("Ya existe un producto con el codigo " + request.sku() + ".");
        }
        Categoria categoria = buscarCategoria(request.categoria());

        Producto producto = new Producto();
        producto.setSku(request.sku());
        copiarDatos(producto, request, categoria);
        return aResponse(productoRepository.save(producto));
    }

    /** El SKU identifica al producto y no cambia: se ignora el del cuerpo. */
    public ProductoResponse actualizar(String sku, ProductoRequest request) {
        Producto producto = buscar(sku);
        Categoria categoria = buscarCategoria(request.categoria());
        copiarDatos(producto, request, categoria);
        return aResponse(productoRepository.save(producto));
    }

    public void eliminar(String sku) {
        Producto producto = buscar(sku);
        if (boletaRepository.existsByDetallesProductoSku(sku)) {
            throw new ReglaNegocioException("No se puede eliminar el producto " + sku + ": figura en boletas.");
        }
        productoRepository.delete(producto);
    }

    private Producto buscar(String sku) {
        return productoRepository.findById(sku)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe el producto " + sku + "."));
    }

    private Categoria buscarCategoria(String codigo) {
        return categoriaRepository.findById(codigo)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe la categoria " + codigo + "."));
    }

    // Pasa los datos del request a la entidad (todo menos el SKU).
    private void copiarDatos(Producto producto, ProductoRequest request, Categoria categoria) {
        producto.setNombre(request.nombre());
        producto.setDescripcion(request.descripcion());
        producto.setPrecio(request.precio());
        producto.setDescuento(request.descuento());
        producto.setStock(request.stock());
        producto.setStockCritico(request.stockCritico());
        producto.setImagen(request.imagen());
        producto.setVideo(request.video());
        producto.setCategoria(categoria);
    }

    private ProductoResponse aResponse(Producto p) {
        return new ProductoResponse(p.getSku(), p.getNombre(), p.getDescripcion(), p.getPrecio(),
                p.getDescuento(), p.getStock(), p.getStockCritico(), p.getImagen(), p.getVideo(),
                p.getCategoria().getCodigo(), p.getCategoria().getNombre());
    }
}
