/*
 * Datos de prueba del sistema (fuente de datos simulada).
 *
 * Replican el modelo logico del README (seccion 4): Categoria, Producto,
 * Compatibilidad, Region, Comuna, Rol, Usuario, Orden, Item de orden y Blog.
 * Productos y usuarios son solo la semilla: la copia de trabajo vive en
 * sessionStorage (ver data/datos.js).
 */

/* ------------------------------------------------------------------ Categoria
   "orden" es la posicion en el recorrido del asistente de armado (RF-07). */
export const categorias = [
	{ codigo: "cpu", nombre: "Procesadores (CPU)", orden: 1 },
	{ codigo: "placa", nombre: "Placas madre", orden: 2 },
	{ codigo: "ram", nombre: "Memoria RAM", orden: 3 },
	{ codigo: "almacenamiento", nombre: "Almacenamiento", orden: 4 },
	{ codigo: "fuente", nombre: "Fuentes de poder", orden: 5 },
	{ codigo: "gabinete", nombre: "Gabinetes", orden: 6 },
	{ codigo: "refrigeracion", nombre: "Refrigeracion", orden: 7 },
	{ codigo: "gpu", nombre: "Tarjetas graficas", orden: 8 },
	{ codigo: "perifericos", nombre: "Perifericos", orden: 9 },
];

/* ------------------------------------------------------------------- Producto
   Las reglas de cada campo estan en RF-10. La imagen y el video se guardan
   como ruta relativa a public/ (o URL completa) y se resuelven con recurso().
   "descuento" es opcional: porcentaje entero de 0 a 90 (ver logic/precios.js). */
export const productos = [
	// --- Procesadores ---
	{
		sku: "CPU-R5-7600",
		nombre: "AMD Ryzen 5 7600",
		descripcion: "Seis nucleos y doce hilos en socket AM5, hasta 5,1 GHz. Incluye disipador Wraith Stealth y grafica integrada.",
		precio: 249990, stock: 18, stockCritico: 5, descuento: 15,
		categoria: "cpu", imagen: "resources/img/productos/CPU-R5-7600.webp", video: "",
	},
	{
		sku: "CPU-R7-7800X3D",
		nombre: "AMD Ryzen 7 7800X3D",
		descripcion: "Ocho nucleos con 96 MB de cache 3D en socket AM5, el favorito para juegos a 1440p sin cuello de botella.",
		precio: 519990, stock: 7, stockCritico: 4,
		categoria: "cpu", imagen: "resources/img/productos/CPU-R7-7800X3D.webp",
		video: "resources/video/ensamblame.mp4",
	},
	{
		sku: "CPU-I5-14600K",
		nombre: "Intel Core i5-14600K",
		descripcion: "Catorce nucleos (6 de rendimiento y 8 de eficiencia) en socket LGA1700, hasta 5,3 GHz. Requiere disipador aparte.",
		precio: 329990, stock: 12, stockCritico: 4,
		categoria: "cpu", imagen: "resources/img/productos/CPU-I5-14600K.webp", video: "",
	},

	// --- Placas madre ---
	{
		sku: "MB-B650-PG",
		nombre: "ASRock B650 PG Lightning",
		descripcion: "Placa ATX socket AM5 con cuatro ranuras DDR5, PCIe 4.0 y dos puertos M.2 con disipador.",
		precio: 189990, stock: 9, stockCritico: 3,
		categoria: "placa", imagen: "resources/img/productos/MB-B650-PG.webp", video: "",
	},
	{
		sku: "MB-X670-ELITE",
		nombre: "Gigabyte X670 AORUS Elite AX",
		descripcion: "Placa ATX socket AM5 con PCIe 5.0, DDR5, Wi-Fi 6E y VRM de 16+2+2 fases para overclock.",
		precio: 329990, stock: 4, stockCritico: 4,
		categoria: "placa", imagen: "resources/img/productos/MB-X670-ELITE.webp", video: "",
	},
	{
		sku: "MB-B760-PLUS",
		nombre: "ASUS PRIME B760-PLUS D5",
		descripcion: "Placa ATX socket LGA1700 con cuatro ranuras DDR5, tres M.2 y respaldo de BIOS FlexKey.",
		precio: 159990, stock: 11, stockCritico: 3,
		categoria: "placa", imagen: "resources/img/productos/MB-B760-PLUS.webp", video: "",
	},
	{
		sku: "MB-B760M-DDR4",
		nombre: "MSI PRO B760M-A DDR4",
		descripcion: "Placa micro-ATX socket LGA1700 con ranuras DDR4, ideal para reutilizar memoria de un equipo anterior.",
		precio: 129990, stock: 14, stockCritico: 3, descuento: 10,
		categoria: "placa", imagen: "resources/img/productos/MB-B760M-DDR4.webp", video: "",
	},

	// --- Memoria RAM ---
	{
		sku: "RAM-DDR5-32-6000",
		nombre: "Corsair Vengeance DDR5 32 GB (2x16) 6000 MT/s",
		descripcion: "Kit de doble canal DDR5 con perfil EXPO y disipador de aluminio de bajo perfil.",
		precio: 129990, stock: 15, stockCritico: 4,
		categoria: "ram", imagen: "resources/img/productos/RAM-DDR5-32-6000.webp", video: "",
	},
	{
		sku: "RAM-DDR5-16-5600",
		nombre: "Kingston Fury Beast DDR5 16 GB 5600 MT/s",
		descripcion: "Modulo DDR5 unico de 16 GB, la entrada mas economica a la plataforma DDR5.",
		precio: 74990, stock: 22, stockCritico: 5, descuento: 20,
		categoria: "ram", imagen: "resources/img/productos/RAM-DDR5-16-5600.webp", video: "",
	},
	{
		sku: "RAM-DDR4-16-3200",
		nombre: "Kingston Fury Beast DDR4 16 GB 3200 MT/s",
		descripcion: "Modulo DDR4 de 16 GB con perfil XMP 2.0, compatible con placas de socket LGA1700 DDR4.",
		precio: 44990, stock: 26, stockCritico: 6,
		categoria: "ram", imagen: "resources/img/productos/RAM-DDR4-16-3200.webp", video: "",
	},
	{
		sku: "RAM-DDR4-32-3600",
		nombre: "G.Skill Ripjaws V DDR4 32 GB (2x16) 3600 MT/s",
		descripcion: "Kit de doble canal DDR4 de 32 GB con latencia CL18 y disipador bajo.",
		precio: 79990, stock: 10, stockCritico: 4,
		categoria: "ram", imagen: "resources/img/productos/RAM-DDR4-32-3600.webp", video: "",
	},

	// --- Almacenamiento ---
	{
		sku: "SSD-NVME-1TB",
		nombre: "Samsung 980 PRO 1 TB NVMe PCIe 4.0",
		descripcion: "Unidad M.2 de 1 TB con lectura de hasta 7.000 MB/s, pensada para el disco del sistema.",
		precio: 89990, stock: 20, stockCritico: 5, descuento: 25,
		categoria: "almacenamiento", imagen: "resources/img/productos/SSD-NVME-1TB.webp", video: "",
	},
	{
		sku: "SSD-NVME-2TB",
		nombre: "Crucial P3 Plus 2 TB NVMe PCIe 4.0",
		descripcion: "Unidad M.2 de 2 TB con buena relacion precio por gigabyte para biblioteca de juegos.",
		precio: 139990, stock: 13, stockCritico: 4,
		categoria: "almacenamiento", imagen: "resources/img/productos/SSD-NVME-2TB.webp", video: "",
	},
	{
		sku: "HDD-2TB",
		nombre: "Seagate BarraCuda 2 TB 7200 rpm",
		descripcion: "Disco mecanico de 3,5 pulgadas para respaldos y archivos que no necesitan velocidad.",
		precio: 54990, stock: 17, stockCritico: 4,
		categoria: "almacenamiento", imagen: "resources/img/productos/HDD-2TB.webp", video: "",
	},

	// --- Fuentes de poder ---
	{
		sku: "PSU-650-BRONZE",
		nombre: "Corsair CV650 650 W 80 Plus Bronze",
		descripcion: "Fuente de 650 W con certificacion 80 Plus Bronze y cableado fijo, suficiente para una gama media.",
		precio: 59990, stock: 16, stockCritico: 4,
		categoria: "fuente", imagen: "resources/img/productos/PSU-650-BRONZE.webp", video: "",
	},
	{
		sku: "PSU-750-GOLD",
		nombre: "Cooler Master MWE Gold 750 W V2",
		descripcion: "Fuente de 750 W totalmente modular con certificacion 80 Plus Gold y ventilador de 120 mm.",
		precio: 94990, stock: 12, stockCritico: 4, descuento: 12,
		categoria: "fuente", imagen: "resources/img/productos/PSU-750-GOLD.webp", video: "",
	},
	{
		sku: "PSU-1000-GOLD",
		nombre: "Seasonic Focus GX-1000 1000 W 80 Plus Gold",
		descripcion: "Fuente ATX 3.0 de 1.000 W con conector 12VHPWR, para tarjetas graficas de tope de linea.",
		precio: 169990, stock: 5, stockCritico: 3,
		categoria: "fuente", imagen: "resources/img/productos/PSU-1000-GOLD.webp", video: "",
	},

	// --- Gabinetes ---
	{
		sku: "CASE-ATX-MESH",
		nombre: "NZXT H5 Flow ATX",
		descripcion: "Gabinete ATX de frente perforado con dos ventiladores incluidos y lateral de vidrio templado.",
		precio: 89990, stock: 8, stockCritico: 3,
		categoria: "gabinete", imagen: "resources/img/productos/CASE-ATX-MESH.webp", video: "",
	},
	{
		sku: "CASE-ATX-RGB",
		nombre: "Lian Li Lancool 216 RGB",
		descripcion: "Gabinete ATX con dos ventiladores frontales de 160 mm ARGB y muy buen flujo de aire.",
		precio: 109990, stock: 6, stockCritico: 3,
		categoria: "gabinete", imagen: "resources/img/productos/CASE-ATX-RGB.webp", video: "",
	},
	{
		sku: "CASE-MATX-COMPACT",
		nombre: "Cooler Master Q300L micro-ATX",
		descripcion: "Gabinete compacto micro-ATX con panel magnetico de polvo, para escritorios pequenos.",
		precio: 54990, stock: 14, stockCritico: 4,
		categoria: "gabinete", imagen: "resources/img/productos/CASE-MATX-COMPACT.webp", video: "",
	},

	// --- Refrigeracion ---
	{
		sku: "COOL-AIR-TOWER",
		nombre: "DeepCool AK400 (aire)",
		descripcion: "Disipador por aire de torre simple con cuatro tubos de calor, silencioso y de bajo costo.",
		precio: 34990, stock: 19, stockCritico: 5,
		categoria: "refrigeracion", imagen: "resources/img/productos/COOL-AIR-TOWER.webp", video: "",
	},
	{
		sku: "COOL-AIO-240",
		nombre: "Arctic Liquid Freezer III 240",
		descripcion: "Refrigeracion liquida cerrada con radiador de 240 mm y pasta termica ya aplicada.",
		precio: 79990, stock: 9, stockCritico: 3, descuento: 18,
		categoria: "refrigeracion", imagen: "resources/img/productos/COOL-AIO-240.webp", video: "",
	},
	{
		sku: "COOL-AIO-360",
		nombre: "NZXT Kraken 360 RGB",
		descripcion: "Refrigeracion liquida de 360 mm con pantalla LCD y tres ventiladores ARGB.",
		precio: 159990, stock: 5, stockCritico: 3,
		categoria: "refrigeracion", imagen: "resources/img/productos/COOL-AIO-360.webp", video: "",
	},

	// --- Tarjetas graficas ---
	{
		sku: "GPU-RTX4060",
		nombre: "NVIDIA GeForce RTX 4060 8 GB",
		descripcion: "Tarjeta de entrada a 1080p con DLSS 3, doble ventilador y consumo de solo 115 W.",
		precio: 399990, stock: 11, stockCritico: 4, descuento: 10,
		categoria: "gpu", imagen: "resources/img/productos/GPU-RTX4060.webp",
		video: "resources/video/ensamblame.mp4",
	},
	{
		sku: "GPU-RTX4070S",
		nombre: "NVIDIA GeForce RTX 4070 Super 12 GB",
		descripcion: "Tarjeta para 1440p con 12 GB GDDR6X, trazado de rayos y DLSS 3 con generacion de cuadros.",
		precio: 749990, stock: 6, stockCritico: 3,
		categoria: "gpu", imagen: "resources/img/productos/GPU-RTX4070S.webp", video: "",
	},
	{
		sku: "GPU-RX7700XT",
		nombre: "AMD Radeon RX 7700 XT 12 GB",
		descripcion: "Alternativa AMD para 1440p con 12 GB GDDR6 y FSR 3, muy competitiva en rasterizado.",
		precio: 549990, stock: 7, stockCritico: 3,
		categoria: "gpu", imagen: "resources/img/productos/GPU-RX7700XT.webp", video: "",
	},
	{
		sku: "GPU-RTX4090",
		nombre: "NVIDIA GeForce RTX 4090 24 GB",
		descripcion: "Tope de linea para 4K con 24 GB GDDR6X. Exige fuente de 1.000 W y gabinete de tamano completo.",
		precio: 2199990, stock: 2, stockCritico: 3,
		categoria: "gpu", imagen: "resources/img/productos/GPU-RTX4090.webp", video: "",
	},

	// --- Perifericos ---
	{
		sku: "PER-KB-MECH",
		nombre: "Teclado mecanico Redragon Kumara K552",
		descripcion: "Teclado TKL con switches rojos, retroiluminacion roja y estructura de aluminio.",
		precio: 34990, stock: 25, stockCritico: 6, descuento: 20,
		categoria: "perifericos", imagen: "resources/img/productos/PER-KB-MECH.webp", video: "",
	},
	{
		sku: "PER-MOUSE-RGB",
		nombre: "Mouse gamer Logitech G203 Lightsync",
		descripcion: "Mouse de 8.000 DPI con seis botones programables e iluminacion RGB.",
		precio: 24990, stock: 30, stockCritico: 8,
		categoria: "perifericos", imagen: "resources/img/productos/PER-MOUSE-RGB.webp", video: "",
	},
	{
		sku: "PER-HEADSET",
		nombre: "Audifonos HyperX Cloud II",
		descripcion: "Audifonos cerrados con sonido envolvente 7.1 por USB y microfono desmontable.",
		precio: 79990, stock: 14, stockCritico: 4,
		categoria: "perifericos", imagen: "resources/img/productos/PER-HEADSET.webp", video: "",
	},
	{
		sku: "PER-MONITOR-27",
		nombre: 'Monitor gamer 27" QHD 165 Hz',
		descripcion: "Panel IPS de 2560x1440 a 165 Hz con 1 ms de respuesta y soporte FreeSync Premium.",
		precio: 219990, stock: 8, stockCritico: 3,
		categoria: "perifericos", imagen: "resources/img/productos/PER-MONITOR-27.webp", video: "",
	},
	{
		sku: "PER-MOUSEPAD",
		nombre: "Mousepad Ensambla.me XL",
		descripcion: "Mousepad de 900x400 mm con base antideslizante. De regalo con cualquier armado completo.",
		precio: 0, stock: 40, stockCritico: 10,
		categoria: "perifericos", imagen: "resources/img/productos/PER-MOUSEPAD.webp", video: "",
	},
];

/* -------------------------------------------------------------- Compatibilidad
   Tabla estatica que asocia cada componente con los admisibles de la categoria
   siguiente (RF-07). No hay ningun calculo tecnico real: si el par esta en la
   tabla, la combinacion se acepta (ver 1.2 y 2.6 del ERS). */
const skusDe = (categoria) => productos.filter((p) => p.categoria === categoria).map((p) => p.sku);

const paresDeCompatibilidad = {
	// CPU -> placa madre: el socket manda.
	"CPU-R5-7600": ["MB-B650-PG", "MB-X670-ELITE"],
	"CPU-R7-7800X3D": ["MB-B650-PG", "MB-X670-ELITE"],
	"CPU-I5-14600K": ["MB-B760-PLUS", "MB-B760M-DDR4"],

	// Placa madre -> RAM: el tipo de memoria que admite el socket.
	"MB-B650-PG": ["RAM-DDR5-32-6000", "RAM-DDR5-16-5600"],
	"MB-X670-ELITE": ["RAM-DDR5-32-6000", "RAM-DDR5-16-5600"],
	"MB-B760-PLUS": ["RAM-DDR5-32-6000", "RAM-DDR5-16-5600"],
	"MB-B760M-DDR4": ["RAM-DDR4-16-3200", "RAM-DDR4-32-3600"],

	// RAM -> almacenamiento: cualquier unidad sirve.
	"RAM-DDR5-32-6000": skusDe("almacenamiento"),
	"RAM-DDR5-16-5600": skusDe("almacenamiento"),
	"RAM-DDR4-16-3200": skusDe("almacenamiento"),
	"RAM-DDR4-32-3600": skusDe("almacenamiento"),

	// Almacenamiento -> fuente: cualquier fuente sirve.
	"SSD-NVME-1TB": skusDe("fuente"),
	"SSD-NVME-2TB": skusDe("fuente"),
	"HDD-2TB": skusDe("fuente"),

	// Fuente -> gabinete: la de 1.000 W no entra en el gabinete compacto.
	"PSU-650-BRONZE": skusDe("gabinete"),
	"PSU-750-GOLD": skusDe("gabinete"),
	"PSU-1000-GOLD": ["CASE-ATX-MESH", "CASE-ATX-RGB"],

	// Gabinete -> refrigeracion: el compacto no admite radiador de 360 mm.
	"CASE-ATX-MESH": skusDe("refrigeracion"),
	"CASE-ATX-RGB": skusDe("refrigeracion"),
	"CASE-MATX-COMPACT": ["COOL-AIR-TOWER", "COOL-AIO-240"],

	// Refrigeracion -> tarjeta grafica: cualquiera sirve.
	"COOL-AIR-TOWER": skusDe("gpu"),
	"COOL-AIO-240": skusDe("gpu"),
	"COOL-AIO-360": skusDe("gpu"),

	// Tarjeta grafica -> perifericos: cualquiera sirve.
	"GPU-RTX4060": skusDe("perifericos"),
	"GPU-RTX4070S": skusDe("perifericos"),
	"GPU-RX7700XT": skusDe("perifericos"),
	"GPU-RTX4090": skusDe("perifericos"),
};

// La relacion Compatibilidad del modelo logico: pares (producto, admisible).
export const compatibilidad = Object.entries(paresDeCompatibilidad).flatMap(([producto, admisibles]) =>
	admisibles.map((admisible) => ({ producto, admisible })),
);

/* --------------------------------------------------------- Region y Comuna */
export const regiones = [
	{ codigo: "AP", nombre: "Arica y Parinacota" },
	{ codigo: "TA", nombre: "Tarapaca" },
	{ codigo: "AN", nombre: "Antofagasta" },
	{ codigo: "AT", nombre: "Atacama" },
	{ codigo: "CO", nombre: "Coquimbo" },
	{ codigo: "VS", nombre: "Valparaiso" },
	{ codigo: "RM", nombre: "Metropolitana de Santiago" },
	{ codigo: "LI", nombre: "O'Higgins" },
	{ codigo: "ML", nombre: "Maule" },
	{ codigo: "NB", nombre: "Nuble" },
	{ codigo: "BI", nombre: "Biobio" },
	{ codigo: "AR", nombre: "La Araucania" },
	{ codigo: "LR", nombre: "Los Rios" },
	{ codigo: "LL", nombre: "Los Lagos" },
	{ codigo: "AI", nombre: "Aysen" },
	{ codigo: "MA", nombre: "Magallanes" },
];

// La comuna determina su region (3NF): la region vive aqui y no en Usuario.
export const comunas = [
	["AP", ["Arica", "Camarones", "Putre", "General Lagos"]],
	["TA", ["Iquique", "Alto Hospicio", "Pozo Almonte", "Pica"]],
	["AN", ["Antofagasta", "Calama", "Tocopilla", "Mejillones", "Taltal"]],
	["AT", ["Copiapo", "Vallenar", "Caldera", "Chanaral", "Huasco"]],
	["CO", ["La Serena", "Coquimbo", "Ovalle", "Illapel", "Vicuna"]],
	["VS", ["Valparaiso", "Vina del Mar", "Quilpue", "Villa Alemana", "San Antonio", "Quillota"]],
	["RM", ["Santiago", "Providencia", "Las Condes", "Nunoa", "Maipu", "Puente Alto", "La Florida", "Recoleta"]],
	["LI", ["Rancagua", "San Fernando", "Rengo", "Machali", "Santa Cruz"]],
	["ML", ["Talca", "Curico", "Linares", "Constitucion", "Cauquenes"]],
	["NB", ["Chillan", "San Carlos", "Bulnes", "Quirihue"]],
	["BI", ["Concepcion", "Talcahuano", "Los Angeles", "Chiguayante", "Coronel"]],
	["AR", ["Temuco", "Padre Las Casas", "Villarrica", "Pucon", "Angol"]],
	["LR", ["Valdivia", "La Union", "Rio Bueno", "Panguipulli"]],
	["LL", ["Puerto Montt", "Osorno", "Castro", "Puerto Varas", "Ancud"]],
	["AI", ["Coyhaique", "Puerto Aysen", "Chile Chico", "Cochrane"]],
	["MA", ["Punta Arenas", "Puerto Natales", "Porvenir", "Cabo de Hornos"]],
].flatMap(([region, nombres]) =>
	nombres.map((nombre, i) => ({
		codigo: `${region}-${String(i + 1).padStart(2, "0")}`,
		nombre,
		region,
	})),
);

/* ------------------------------------------------------------------- Rol
   La relacion contiene exactamente tres filas (ver modelo logico, 3.2). */
export const roles = [
	{ codigo: "ADMIN", nombre: "Administrador" },
	{ codigo: "CLIENTE", nombre: "Cliente" },
	{ codigo: "LOGISTICA", nombre: "Administrador logistico" },
];

/* --------------------------------------------------------------- Usuario
   RUN sin puntos ni guion y con digito verificador valido (RF-01). */
export const usuarios = [
	{
		run: "190110222", nombre: "Daniel", apellidos: "Munoz Rojas",
		correo: "admin@duoc.cl", contrasena: "admin1234",
		fechaNacimiento: "1998-04-12", comuna: "RM-02",
		direccion: "Av. Providencia 1760, Providencia", tipoUsuario: "ADMIN",
	},
	{
		run: "152345674", nombre: "Jorge", apellidos: "Perez Lillo",
		correo: "bodega@duoc.cl", contrasena: "bodega123",
		fechaNacimiento: "1990-09-30", comuna: "VS-03",
		direccion: "Calle Valparaiso 1210, Quilpue", tipoUsuario: "LOGISTICA",
	},
	{
		run: "123456785", nombre: "Camila", apellidos: "Soto Vera",
		correo: "camila@gmail.com", contrasena: "cliente123",
		fechaNacimiento: "2001-01-24", comuna: "RM-04",
		direccion: "Irarrazaval 2550, Nunoa", tipoUsuario: "CLIENTE",
	},
	{
		run: "201234565", nombre: "Matias", apellidos: "Rivas Gomez",
		correo: "matias@gmail.com", contrasena: "matias12",
		fechaNacimiento: "2003-07-08", comuna: "BI-01",
		direccion: "Barros Arana 890, Concepcion", tipoUsuario: "CLIENTE",
	},
	{
		run: "98765433", nombre: "Patricia", apellidos: "Alvarez Diaz",
		correo: "patricia@profesor.duoc.cl", contrasena: "docente1",
		fechaNacimiento: "1985-11-03", comuna: "RM-01",
		direccion: "Alameda 1449, Santiago", tipoUsuario: "CLIENTE",
	},
];

/* ------------------------------------------------- Orden e Item de orden
   Historial de compras de ejemplo; las compras nuevas las crea crearOrden. El
   precio unitario se guarda en la linea porque el precio del producto puede
   cambiar despues. La orden guarda una copia de los datos de envio y "cliente"
   es "" cuando compro un invitado. "entrega" es DOMICILIO o RETIRO y el envio
   es gratis desde $200.000 (ver logic/checkout.js). */
export const ordenes = [
	{
		numero: "ORD-2026-0001", cliente: "123456785", fecha: "2026-09-12",
		nombre: "Camila Soto Vera", correo: "camila@gmail.com",
		direccion: "Irarrazaval 2550, Nunoa", comuna: "RM-04",
		entrega: "DOMICILIO", costoEnvio: 0, medioPago: "Tarjeta terminada en 4242",
	},
	{
		numero: "ORD-2026-0002", cliente: "201234565", fecha: "2026-09-18",
		nombre: "Matias Rivas Gomez", correo: "matias@gmail.com",
		direccion: "Barros Arana 890, Concepcion", comuna: "BI-01",
		entrega: "DOMICILIO", costoEnvio: 0, medioPago: "Tarjeta terminada en 4242",
	},
	{
		numero: "ORD-2026-0003", cliente: "98765433", fecha: "2026-09-23",
		nombre: "Patricia Alvarez Diaz", correo: "patricia@profesor.duoc.cl",
		direccion: "Alameda 1449, Santiago", comuna: "RM-01",
		entrega: "RETIRO", costoEnvio: 0, medioPago: "Tarjeta terminada en 4242",
	},
	{
		numero: "ORD-2026-0004", cliente: "123456785", fecha: "2026-09-27",
		nombre: "Camila Soto Vera", correo: "camila@gmail.com",
		direccion: "Irarrazaval 2550, Nunoa", comuna: "RM-04",
		entrega: "DOMICILIO", costoEnvio: 0, medioPago: "Tarjeta terminada en 4242",
	},
	{
		numero: "ORD-2026-0005", cliente: "201234565", fecha: "2026-10-03",
		nombre: "Matias Rivas Gomez", correo: "matias@gmail.com",
		direccion: "Barros Arana 890, Concepcion", comuna: "BI-01",
		entrega: "DOMICILIO", costoEnvio: 4990, medioPago: "Tarjeta terminada en 4242",
	},
	{
		numero: "ORD-2026-0006", cliente: "98765433", fecha: "2026-10-09",
		nombre: "Patricia Alvarez Diaz", correo: "patricia@profesor.duoc.cl",
		direccion: "Alameda 1449, Santiago", comuna: "RM-01",
		entrega: "RETIRO", costoEnvio: 0, medioPago: "Tarjeta terminada en 4242",
	},
	{
		numero: "ORD-2026-0007", cliente: "", fecha: "2026-10-14",
		nombre: "Sofia Contreras Pino", correo: "sofia.contreras@gmail.com",
		direccion: "Los Leones 1200, Providencia", comuna: "RM-02",
		entrega: "DOMICILIO", costoEnvio: 0, medioPago: "Tarjeta terminada en 4242",
	},
];

export const itemsOrden = [
	{ orden: "ORD-2026-0001", producto: "CPU-R5-7600", cantidad: 1, precioUnitario: 239990 },
	{ orden: "ORD-2026-0001", producto: "MB-B650-PG", cantidad: 1, precioUnitario: 189990 },
	{ orden: "ORD-2026-0001", producto: "RAM-DDR5-16-5600", cantidad: 2, precioUnitario: 72990 },

	{ orden: "ORD-2026-0002", producto: "GPU-RTX4060", cantidad: 1, precioUnitario: 409990 },
	{ orden: "ORD-2026-0002", producto: "PER-MOUSE-RGB", cantidad: 1, precioUnitario: 24990 },

	{ orden: "ORD-2026-0003", producto: "PER-MONITOR-27", cantidad: 2, precioUnitario: 219990 },
	{ orden: "ORD-2026-0003", producto: "PER-KB-MECH", cantidad: 1, precioUnitario: 32990 },
	{ orden: "ORD-2026-0003", producto: "PER-HEADSET", cantidad: 1, precioUnitario: 79990 },

	{ orden: "ORD-2026-0004", producto: "SSD-NVME-2TB", cantidad: 1, precioUnitario: 139990 },
	{ orden: "ORD-2026-0004", producto: "COOL-AIO-240", cantidad: 1, precioUnitario: 79990 },

	{ orden: "ORD-2026-0005", producto: "RAM-DDR4-16-3200", cantidad: 1, precioUnitario: 44990 },
	{ orden: "ORD-2026-0005", producto: "PER-MOUSE-RGB", cantidad: 1, precioUnitario: 24990 },

	// Precios con la oferta vigente al comprar (SSD -25 %, teclado -20 %).
	{ orden: "ORD-2026-0006", producto: "SSD-NVME-1TB", cantidad: 1, precioUnitario: 67493 },
	{ orden: "ORD-2026-0006", producto: "PER-KB-MECH", cantidad: 1, precioUnitario: 27992 },

	{ orden: "ORD-2026-0007", producto: "GPU-RTX4060", cantidad: 1, precioUnitario: 359991 },
	{ orden: "ORD-2026-0007", producto: "COOL-AIR-TOWER", cantidad: 1, precioUnitario: 34990 },
];

/* ----------------------------------------------------------------- Blogs */
export const blogs = [
	{
		slug: "orden-de-armado",
		titulo: "En que orden conviene armar tu PC",
		fecha: "2026-09-05",
		autor: "Equipo Ensambla.me",
		imagen: "resources/img/blog-1.svg",
		resumen: "Montar el procesador y la memoria antes de meter la placa al gabinete te ahorra la mitad del trabajo. Te contamos la secuencia que usamos en el taller.",
		cuerpo: [
			"La mayoria de los armados que llegan al taller con tornillos de mas o cables mal ruteados tienen la misma causa: se empezo por el gabinete. Trabajar sobre la caja de la placa madre, con espacio y buena luz, hace que el resto del armado se ordene solo.",
			"La secuencia que recomendamos es: procesador sobre la placa, memoria en las ranuras que indica el manual (casi siempre la segunda y la cuarta), unidad M.2 bajo su disipador y recien entonces la placa dentro del gabinete. Con eso ya no tienes que meter las manos entre paneles para calzar un modulo de RAM.",
			"Despues vienen la fuente, el ruteo de cables por la parte trasera y, al final, la tarjeta grafica: es la pieza mas larga y la que estorba para todo lo demas. Antes de cerrar, conecta monitor y teclado y enciende una vez fuera del escritorio; si algo quedo suelto, prefieres descubrirlo con el lateral abierto.",
			"El asistente de armado del sitio sigue este mismo orden, categoria por categoria, para que la lista de compras te quede en la secuencia en que vas a usar las piezas.",
		],
	},
	{
		slug: "cuanta-fuente-necesito",
		titulo: "Cuantos watts necesita tu fuente de poder",
		fecha: "2026-09-14",
		autor: "Equipo Ensambla.me",
		imagen: "resources/img/blog-2.svg",
		resumen: "La regla de sumar el consumo de la tarjeta grafica y el procesador y agregar un margen del 30 % sigue siendo la mas confiable. Aqui la aplicamos a tres armados tipo.",
		cuerpo: [
			"Una fuente no entrega la potencia que dice la etiqueta en cualquier condicion: entrega su maximo con buena ventilacion y pierde eficiencia cuando trabaja al limite. Por eso el calculo parte del consumo real de los dos componentes que mandan, procesador y tarjeta grafica, y agrega un margen.",
			"Para un armado de 1080p con un Ryzen 5 y una RTX 4060 (115 W) basta una fuente de 650 W 80 Plus Bronze. Un equipo de 1440p con RTX 4070 Super o RX 7700 XT queda comodo con 750 W Gold. Una RTX 4090 no admite economias: pide 1.000 W con conector 12VHPWR y ATX 3.0.",
			"Dos advertencias del taller: la certificacion 80 Plus habla de eficiencia, no de potencia, y una fuente sin marca de 800 W rinde peor que una Gold de 650 W. Y si vas a cambiar la tarjeta grafica en un ano, compra hoy la fuente que esa tarjeta va a necesitar.",
			"En el asistente de armado veras que al escoger una fuente de 1.000 W se descartan los gabinetes compactos: no es un juicio tecnico automatico, es la tabla de compatibilidad del catalogo que ya trae esa combinacion resuelta.",
		],
	},
	{
		slug: "ddr4-o-ddr5",
		titulo: "DDR4 o DDR5: cuando vale la pena el cambio",
		fecha: "2026-09-22",
		autor: "Equipo Ensambla.me",
		imagen: "resources/img/blog-3.svg",
		resumen: "Si vienes de un equipo con DDR4 y quieres reutilizar la memoria, todavia hay placas que te lo permiten. Revisamos en que casos conviene y en cuales no.",
		cuerpo: [
			"El tipo de memoria no se elige: lo decide la placa madre, y la placa la decide el socket del procesador. Un Ryzen 7000 en socket AM5 solo acepta DDR5. Un Core i5 de 14a generacion, en cambio, tiene placas LGA1700 en ambas versiones, asi que ahi si hay una decision que tomar.",
			"Reutilizar un kit DDR4 de 32 GB que ya tienes ahorra unos 80 mil pesos y, en juegos a 1440p con la tarjeta grafica como cuello de botella, la diferencia de cuadros por segundo rara vez pasa del 5 %. Si el presupuesto esta justo, ese dinero rinde mucho mas en la tarjeta grafica.",
			"El punto en contra es la vida util de la plataforma: una placa DDR4 de socket LGA1700 es el final del camino, mientras AM5 y las placas DDR5 tienen recambio de procesador por varios anos mas. Si el equipo lo vas a ir mejorando por partes, parte en DDR5.",
			"En el catalogo esto se ve directo: al escoger la placa MSI PRO B760M-A DDR4, el asistente solo ofrece modulos DDR4; con cualquier otra placa del catalogo, solo DDR5.",
		],
	},
];
