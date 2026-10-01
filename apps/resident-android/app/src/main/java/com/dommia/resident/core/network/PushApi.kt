package com.dommia.resident.core.network

import com.dommia.resident.core.model.ApiEnvelope
import kotlinx.serialization.Serializable
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.POST
import retrofit2.http.Path

interface PushApi {
    @POST("auth/app/resident/devices/fcm-token")
    suspend fun registerToken(@Body request: PushTokenRequest): ApiEnvelope<PushTokenRegistration>

    @DELETE("auth/app/resident/devices/fcm-token/{deviceId}")
    suspend fun revokeToken(@Path("deviceId") deviceId: String): ApiEnvelope<PushTokenRegistration>
}

@Serializable
data class PushTokenRequest(
    val deviceId: String,
    val token: String,
)

@Serializable
data class PushTokenRegistration(
    val id: String = "",
    val deviceId: String = "",
    val clientType: String = "ANDROID",
    val isActive: Boolean = true,
    val lastSeenAt: String? = null,
)
