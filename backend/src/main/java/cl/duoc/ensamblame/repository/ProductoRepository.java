package cl.duoc.ensamblame.repository;

import cl.duoc.ensamblame.model.Producto;
import jakarta.persistence.LockModeType;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductoRepository extends JpaRepository<Producto, String> {

    // Spring genera la consulta a partir del nombre del metodo.
    List<Producto> findByCategoriaCodigo(String codigoCategoria);

    boolean existsByCategoriaCodigo(String codigoCategoria);

    // Busca el texto en el nombre o en el SKU, sin distinguir mayusculas.
    List<Producto> findByNombreContainingIgnoreCaseOrSkuContainingIgnoreCase(String nombre, String sku);

    // Lee los productos bloqueando sus filas hasta el fin de la transaccion, para que dos
    // compras simultaneas no descuenten el mismo stock.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Producto p where p.sku in :skus")
    List<Producto> bloquearPorSku(@Param("skus") Collection<String> skus);
}
