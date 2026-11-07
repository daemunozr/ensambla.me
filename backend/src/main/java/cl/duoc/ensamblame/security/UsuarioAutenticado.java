package cl.duoc.ensamblame.security;

import cl.duoc.ensamblame.model.TipoUsuario;

/** Quien hace la peticion, segun los datos del token JWT. Es el "principal" de Spring Security. */
public record UsuarioAutenticado(String run, String correo, TipoUsuario rol) {
}
