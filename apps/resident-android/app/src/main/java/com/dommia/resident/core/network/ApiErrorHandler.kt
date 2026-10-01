package com.dommia.resident.core.network

import retrofit2.HttpException
import java.io.IOException

object ApiErrorHandler {
    fun mapThrowable(throwable: Throwable): ApiResult.Error {
        return when (throwable) {
            is HttpException -> ApiResult.Error(
                message = when (throwable.code()) {
                    401 -> "Correo, teléfono o contraseña incorrectos. Por favor, verifica tus datos."
                    403 -> "No tienes permisos para acceder a esta comunidad."
                    429 -> "Has realizado demasiados intentos. Por favor, espera unos minutos."
                    500, 502, 503 -> "Los servidores están experimentando problemas técnicos. Inténtalo más tarde."
                    else -> "Ocurrió un error inesperado al procesar tu solicitud."
                },
                code = throwable.code(),
            )
            is IOException -> ApiResult.Error("No se pudo conectar con el servidor. Verifica tu conexión a internet o que los servicios locales estén encendidos.")
            else -> ApiResult.Error(throwable.message ?: "Ocurrió un error inesperado.")
        }
    }
}
