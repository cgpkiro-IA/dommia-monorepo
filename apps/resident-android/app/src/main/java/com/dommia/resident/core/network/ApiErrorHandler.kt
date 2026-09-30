package com.dommia.resident.core.network

import retrofit2.HttpException
import java.io.IOException

object ApiErrorHandler {
    fun <T> mapThrowable(throwable: Throwable): ApiResult.Error {
        return when (throwable) {
            is HttpException -> ApiResult.Error(
                message = when (throwable.code()) {
                    401 -> "La sesión expiró o fue revocada."
                    403 -> "No tienes acceso a este módulo o acción."
                    429 -> "Demasiados intentos. Intenta más tarde."
                    else -> "No se pudo completar la solicitud."
                },
                code = throwable.code(),
            )
            is IOException -> ApiResult.Error("Sin conexión. Revisa tu red e inténtalo otra vez.")
            else -> ApiResult.Error(throwable.message ?: "Error inesperado.")
        }
    }
}
