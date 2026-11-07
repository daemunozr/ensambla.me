package cl.duoc.ensamblame.config;

import cl.duoc.ensamblame.model.Boleta;
import cl.duoc.ensamblame.model.Categoria;
import cl.duoc.ensamblame.model.Producto;
import cl.duoc.ensamblame.model.TipoEntrega;
import cl.duoc.ensamblame.model.TipoUsuario;
import cl.duoc.ensamblame.model.Usuario;
import cl.duoc.ensamblame.repository.BoletaRepository;
import cl.duoc.ensamblame.repository.CategoriaRepository;
import cl.duoc.ensamblame.repository.ProductoRepository;
import cl.duoc.ensamblame.repository.UsuarioRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Carga datos de ejemplo al arrancar, solo si las tablas estan vacias. Son un subconjunto de
 * los datos de prueba del frontend (src/data/semillas.js).
 */
@Configuration
public class CargaInicial {

    @Bean
    public CommandLineRunner cargarDatos(CategoriaRepository categorias, ProductoRepository productos,
            UsuarioRepository usuarios, BoletaRepository boletas, PasswordEncoder passwordEncoder) {
        return args -> {
            if (categorias.count() == 0) {
                cargarCatalogo(categorias, productos);
            }
            if (usuarios.count() == 0) {
                cargarUsuarios(usuarios, passwordEncoder);
            }
            if (boletas.count() == 0) {
                cargarBoletas(boletas, productos, usuarios);
            }
        };
    }

    private void cargarCatalogo(CategoriaRepository categorias, ProductoRepository productos) {
        Categoria cpu = new Categoria("cpu", "Procesadores (CPU)", 1);
        Categoria placa = new Categoria("placa", "Placas madre", 2);
        Categoria ram = new Categoria("ram", "Memoria RAM", 3);
        Categoria almacenamiento = new Categoria("almacenamiento", "Almacenamiento", 4);
        Categoria fuente = new Categoria("fuente", "Fuentes de poder", 5);
        Categoria gabinete = new Categoria("gabinete", "Gabinetes", 6);
        Categoria refrigeracion = new Categoria("refrigeracion", "Refrigeracion", 7);
        Categoria gpu = new Categoria("gpu", "Tarjetas graficas", 8);
        Categoria perifericos = new Categoria("perifericos", "Perifericos", 9);
        categorias.saveAll(List.of(cpu, placa, ram, almacenamiento, fuente, gabinete, refrigeracion, gpu,
                perifericos));

        productos.saveAll(List.of(
                producto("CPU-R5-7600", "AMD Ryzen 5 7600", "249990", 15, 18, 5, cpu),
                producto("MB-B650-PG", "ASRock B650 PG Lightning", "189990", null, 9, 3, placa),
                producto("RAM-DDR5-32-6000", "Corsair Vengeance DDR5 32 GB (2x16) 6000 MT/s", "129990", null, 15, 4, ram),
                producto("SSD-NVME-1TB", "Samsung 980 PRO 1 TB NVMe PCIe 4.0", "89990", 25, 20, 5, almacenamiento),
                producto("PSU-650-BRONZE", "Corsair CV650 650 W 80 Plus Bronze", "59990", null, 16, 4, fuente),
                producto("CASE-ATX-MESH", "NZXT H5 Flow ATX", "89990", null, 8, 3, gabinete),
                producto("COOL-AIR-TOWER", "DeepCool AK400 (aire)", "34990", null, 19, 5, refrigeracion),
                producto("GPU-RTX4060", "NVIDIA GeForce RTX 4060 8 GB", "399990", 10, 11, 4, gpu),
                producto("PER-KB-MECH", "Teclado mecanico Redragon Kumara K552", "34990", 20, 25, 6, perifericos)));
    }

    // Boletas de ejemplo. Se guardan tal cual: el stock sembrado ya es el actual y no se descuenta.
    private void cargarBoletas(BoletaRepository boletas, ProductoRepository productos,
            UsuarioRepository usuarios) {
        Usuario camila = usuarios.findById("123456785").orElseThrow();

        Boleta primera = boleta("ORD-2026-0001", camila, LocalDate.of(2026, 10, 5), "Camila Soto Vera",
                "camila@gmail.com", "Irarrazaval 2550, Nunoa", "RM-04", TipoEntrega.DOMICILIO,
                "Tarjeta terminada en 4242", "4990");
        agregar(primera, productos, "CPU-R5-7600", 1, "212492");
        agregar(primera, productos, "RAM-DDR5-32-6000", 1, "129990");

        Boleta segunda = boleta("ORD-2026-0002", null, LocalDate.of(2026, 10, 12), "Pedro Rojas",
                "pedro@gmail.com", "Av. Matta 410, Santiago", "RM-01", TipoEntrega.RETIRO,
                "Tarjeta terminada en 4242", "0");
        agregar(segunda, productos, "PER-KB-MECH", 1, "27992");

        Boleta tercera = boleta("ORD-2026-0003", camila, LocalDate.of(2026, 10, 20), "Camila Soto Vera",
                "camila@gmail.com", "Irarrazaval 2550, Nunoa", "RM-04", TipoEntrega.DOMICILIO,
                "Tarjeta terminada en 4242", "4990");
        agregar(tercera, productos, "SSD-NVME-1TB", 1, "67493");
        agregar(tercera, productos, "COOL-AIR-TOWER", 1, "34990");

        boletas.saveAll(List.of(primera, segunda, tercera));
    }

    private Boleta boleta(String numero, Usuario usuario, LocalDate fecha, String nombre, String correo,
            String direccion, String comuna, TipoEntrega entrega, String medioPago, String costoEnvio) {
        Boleta boleta = new Boleta();
        boleta.setNumero(numero);
        boleta.setUsuario(usuario);
        boleta.setFecha(fecha);
        boleta.setNombre(nombre);
        boleta.setCorreo(correo);
        boleta.setDireccion(direccion);
        boleta.setComuna(comuna);
        boleta.setEntrega(entrega);
        boleta.setMedioPago(medioPago);
        boleta.setCostoEnvio(new BigDecimal(costoEnvio));
        return boleta;
    }

    private void agregar(Boleta boleta, ProductoRepository productos, String sku, int cantidad,
            String precioUnitario) {
        boleta.agregarDetalle(productos.findById(sku).orElseThrow(), cantidad, new BigDecimal(precioUnitario));
    }

    private Producto producto(String sku, String nombre, String precio, Integer descuento, int stock,
            int stockCritico, Categoria categoria) {
        Producto producto = new Producto();
        producto.setSku(sku);
        producto.setNombre(nombre);
        producto.setPrecio(new BigDecimal(precio));
        producto.setDescuento(descuento);
        producto.setStock(stock);
        producto.setStockCritico(stockCritico);
        producto.setImagen("resources/img/productos/" + sku + ".webp");
        producto.setCategoria(categoria);
        return producto;
    }

    private void cargarUsuarios(UsuarioRepository usuarios, PasswordEncoder passwordEncoder) {
        usuarios.saveAll(List.of(
                usuario("190110222", "Daniel", "Munoz Rojas", "admin@duoc.cl", "admin1234",
                        LocalDate.of(1998, 4, 12), "RM", "RM-02", "Av. Providencia 1760, Providencia",
                        TipoUsuario.ADMIN, passwordEncoder),
                usuario("152345674", "Jorge", "Perez Lillo", "bodega@duoc.cl", "bodega123",
                        LocalDate.of(1990, 9, 30), "VS", "VS-03", "Calle Valparaiso 1210, Quilpue",
                        TipoUsuario.LOGISTICA, passwordEncoder),
                usuario("123456785", "Camila", "Soto Vera", "camila@gmail.com", "cliente123",
                        LocalDate.of(2001, 1, 24), "RM", "RM-04", "Irarrazaval 2550, Nunoa",
                        TipoUsuario.CLIENTE, passwordEncoder)));
    }

    private Usuario usuario(String run, String nombre, String apellidos, String correo, String contrasena,
            LocalDate nacimiento, String region, String comuna, String direccion, TipoUsuario tipo,
            PasswordEncoder passwordEncoder) {
        Usuario usuario = new Usuario();
        usuario.setRun(run);
        usuario.setNombre(nombre);
        usuario.setApellidos(apellidos);
        usuario.setCorreo(correo);
        usuario.setContrasena(passwordEncoder.encode(contrasena));
        usuario.setFechaNacimiento(nacimiento);
        usuario.setRegion(region);
        usuario.setComuna(comuna);
        usuario.setDireccion(direccion);
        usuario.setTipoUsuario(tipo);
        return usuario;
    }
}
