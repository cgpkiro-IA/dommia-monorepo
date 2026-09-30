package com.dommia.resident.core.session

import com.dommia.resident.core.network.ApiErrorHandler
import com.dommia.resident.core.network.ApiResult
import com.dommia.resident.core.network.PushApi
import com.dommia.resident.core.network.PushTokenRegistration
import com.dommia.resident.core.network.PushTokenRequest

class PushTokenRepository(
    private val pushApi: PushApi,
    private val sessionManager: SessionManager,
) {
    suspend fun register(token: String): ApiResult<PushTokenRegistration> = runRequest {
        val response = pushApi.registerToken(PushTokenRequest(sessionManager.deviceId, token))
        response.data.takeIf { response.success && it != null } ?: error(response.message ?: "No se pudo registrar el dispositivo.")
    }

    suspend fun revoke(): ApiResult<PushTokenRegistration> = runRequest {
        val response = pushApi.revokeToken(sessionManager.deviceId)
        response.data.takeIf { response.success && it != null } ?: error(response.message ?: "No se pudo revocar el dispositivo.")
    }

    private suspend fun <T> runRequest(request: suspend () -> T): ApiResult<T> {
        return try {
            ApiResult.Success(request())
        } catch (exception: Exception) {
            val result = ApiErrorHandler.mapThrowable(exception)
            if (result.code == 401) sessionManager.expireSession()
            result
        }
    }
}
