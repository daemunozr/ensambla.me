package cl.duoc.ensamblame.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/** Permite que el frontend (Vite, en otro puerto) llame a la API desde el navegador. */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    // Se lee de application.yml (app.cors.origen); varios origenes van separados por coma.
    @Value("${app.cors.origen}")
    private String[] origenesPermitidos;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(origenesPermitidos)
                .allowedMethods("GET", "POST", "PUT", "DELETE");
    }
}
