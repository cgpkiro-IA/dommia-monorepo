package com.dommia.resident.core.session

import com.dommia.resident.core.model.AccessCredential
import com.dommia.resident.core.network.AccessApi
import com.dommia.resident.core.network.ApiErrorHandler
import com.dommia.resident.core.network.ApiResult

class AccessRepository(
    private val accessApi: AccessApi,
    private val sessionManager: SessionManager,
) {
    suspend fun getCredential(): ApiResult<AccessCredential> {
        return try {
            val response = accessApi.getCredential()
            if (response.success && response.data != null && response.data.payload.isNotBlank()) {
                ApiResult.Success(response.data)
            } else {
                ApiResult.Error(response.message ?: "La credencial de acceso no está disponible.")
            }
        } catch (exception: Exception) {
            val result = ApiErrorHandler.mapThrowable(exception)
            if (result.code == 401) {
                sessionManager.expireSession()
            }
            result
        }
    }
}
