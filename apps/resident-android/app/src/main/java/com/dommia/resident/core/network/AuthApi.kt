package com.dommia.resident.core.network

import com.dommia.resident.core.model.ApiEnvelope
import com.dommia.resident.core.model.ResidentProfile
import com.dommia.resident.core.model.ResidentProfileResponse
import kotlinx.serialization.Serializable
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

interface AuthApi {
    @POST("auth/app/resident/login")
    suspend fun login(@Body request: ResidentLoginRequest): ApiEnvelope<ResidentAuthSession>

    @POST("auth/app/resident/refresh")
    suspend fun refresh(@Body request: ResidentRefreshRequest): ApiEnvelope<ResidentAuthSession>

    @POST("auth/app/resident/logout")
    suspend fun logout(): ApiEnvelope<Unit>

    @GET("auth/app/resident/me")
    suspend fun me(): ApiEnvelope<ResidentProfileResponse>

    @POST("auth/resident/activate")
    suspend fun activate(@Body request: ResidentActivateRequest): ApiEnvelope<ResidentProfile>

    @POST("auth/resident/password-recovery")
    suspend fun requestPasswordRecovery(@Body request: ResidentPasswordRecoveryRequest): ApiEnvelope<PasswordRecoveryResult>

    @POST("auth/resident/password-reset")
    suspend fun resetPassword(@Body request: ResidentPasswordResetRequest): ApiEnvelope<ResidentProfile>

    @POST("auth/app/resident/change-password")
    suspend fun changeAppPassword(@Body request: ResidentAppChangePasswordRequest): ApiEnvelope<ResidentProfile>
}

data class ResidentLoginRequest(
    val identifier: String,
    val password: String,
    val tenantSlug: String,
    val clientType: String = "ANDROID",
    val deviceId: String? = null,
    val deviceName: String? = null,
)

data class ResidentRefreshRequest(
    val refreshToken: String,
)

data class ResidentAuthSession(
    val accessToken: String = "",
    val refreshToken: String = "",
    val tokenType: String = "Bearer",
    val expiresIn: Long = 900,
    val refreshExpiresAt: String? = null,
    val resident: ResidentProfile? = null,
    val tenantSlug: String? = null,
    val clientType: String? = null,
    val passwordChangeRequired: Boolean = false,
)

@Serializable
data class ResidentActivateRequest(
    val token: String,
    val password: String,
)

@Serializable
data class ResidentPasswordRecoveryRequest(
    val identifier: String,
    val tenantSlug: String,
)

@Serializable
data class ResidentPasswordResetRequest(
    val token: String,
    val newPassword: String,
)

@Serializable
data class ResidentAppChangePasswordRequest(
    val identifier: String,
    val tenantSlug: String,
    val currentPassword: String,
    val newPassword: String,
)

@Serializable
data class PasswordRecoveryResult(
    val expiresAt: String? = null,
    val resetToken: String? = null,
)
