package com.dommia.resident.core.network

sealed class ApiResult<out T> {
    data class Success<T>(val value: T) : ApiResult<T>()
    data class Error(val message: String, val code: Int? = null) : ApiResult<Nothing>()
    data class Loading<T>(val value: T? = null) : ApiResult<T>()
}
