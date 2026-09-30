package com.dommia.resident.core.session

import com.dommia.resident.core.model.CreateVisitorPassRequest
import com.dommia.resident.core.model.ResidentNotice
import com.dommia.resident.core.model.VisitorPass
import com.dommia.resident.core.network.ApiErrorHandler
import com.dommia.resident.core.network.ApiResult
import com.dommia.resident.core.network.ResidentContentApi

class ResidentContentRepository(
    private val api: ResidentContentApi,
    private val sessionManager: SessionManager,
) {
    suspend fun getNotices(): ApiResult<List<ResidentNotice>> = runRequest {
        val response = api.getNotices()
        response.data.takeIf { response.success && it != null } ?: error(response.message ?: "No se pudieron cargar los avisos.")
    }

    suspend fun getVisitorPasses(): ApiResult<List<VisitorPass>> = runRequest {
        val response = api.getVisitorPasses()
        response.data.takeIf { response.success && it != null } ?: error(response.message ?: "No se pudieron cargar los pases.")
    }

    suspend fun createVisitorPass(request: CreateVisitorPassRequest): ApiResult<VisitorPass> = runRequest {
        val response = api.createVisitorPass(request)
        response.data.takeIf { response.success && it != null } ?: error(response.message ?: "No se pudo crear el pase.")
    }

    suspend fun revokeVisitorPass(id: String): ApiResult<VisitorPass> = runRequest {
        val response = api.revokeVisitorPass(id)
        response.data.takeIf { response.success && it != null } ?: error(response.message ?: "No se pudo revocar el pase.")
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
