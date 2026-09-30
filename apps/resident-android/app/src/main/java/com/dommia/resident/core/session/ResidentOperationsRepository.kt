package com.dommia.resident.core.session

import com.dommia.resident.core.model.ResidentOperations
import com.dommia.resident.core.network.AccessApi
import com.dommia.resident.core.network.ApiErrorHandler
import com.dommia.resident.core.network.ApiResult
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope

class ResidentOperationsRepository(
    private val accessApi: AccessApi,
    private val sessionManager: SessionManager,
) {
    suspend fun getOperations(): ApiResult<ResidentOperations> {
        return try {
            coroutineScope {
                val services = async { accessApi.getActiveServices() }
                val deliveries = async { accessApi.getActiveDeliveries() }
                val servicesResponse = services.await()
                val deliveriesResponse = deliveries.await()
                if (!servicesResponse.success || !deliveriesResponse.success) {
                    ApiResult.Error(
                        servicesResponse.message ?: deliveriesResponse.message ?: "No se pudo cargar la actividad de acceso.",
                    )
                } else {
                    ApiResult.Success(
                        ResidentOperations(
                            services = servicesResponse.data.orEmpty(),
                            deliveries = deliveriesResponse.data.orEmpty(),
                        ),
                    )
                }
            }
        } catch (exception: Exception) {
            val result = ApiErrorHandler.mapThrowable(exception)
            if (result.code == 401) sessionManager.expireSession()
            result
        }
    }
}
