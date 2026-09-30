package com.dommia.resident.core.session

import com.dommia.resident.core.model.ResidentProfile
import com.dommia.resident.core.network.ApiErrorHandler
import com.dommia.resident.core.network.ApiResult
import com.dommia.resident.core.network.AuthApi
import com.dommia.resident.core.network.ResidentLoginRequest
import com.dommia.resident.core.network.ResidentRefreshRequest
import com.dommia.resident.core.network.ResidentAuthSession
import com.dommia.resident.core.network.ResidentActivateRequest
import com.dommia.resident.core.network.ResidentPasswordRecoveryRequest
import com.dommia.resident.core.network.ResidentPasswordResetRequest
import com.dommia.resident.core.network.ResidentAppChangePasswordRequest

class AuthRepository(
    private val authApi: AuthApi,
    private val sessionManager: SessionManager,
) {
    suspend fun login(
        identifier: String,
        password: String,
        tenantSlug: String,
    ): ApiResult<ResidentAuthSession> {
        return try {
            val response = authApi.login(
                ResidentLoginRequest(
                    identifier = identifier,
                    password = password,
                    tenantSlug = tenantSlug,
                    clientType = "ANDROID",
                ),
            )

            if (response.success && response.data != null) {
                if (response.data.accessToken.isNotBlank() && response.data.refreshToken.isNotBlank()) {
                    sessionManager.saveSession(
                        accessToken = response.data.accessToken,
                        refreshToken = response.data.refreshToken,
                        resident = response.data.resident ?: sessionManager.profile,
                    )
                }
                ApiResult.Success(response.data)
            } else {
                ApiResult.Error(response.message ?: "No se pudo iniciar sesión.")
            }
        } catch (e: Exception) {
            val result = ApiErrorHandler.mapThrowable(e)
            if (result.code == 401 || result.code == 403) {
                sessionManager.expireSession()
            }
            result
        }
    }

    suspend fun me(): ApiResult<ResidentProfile> {
        return try {
            val response = authApi.me()
            if (response.success && response.data != null) {
                sessionManager.updateProfile(response.data.resident)
                ApiResult.Success(response.data.resident)
            } else {
                if (response.message?.contains("401", true) == true || response.message?.contains("403", true) == true) {
                    sessionManager.expireSession()
                }
                ApiResult.Error(response.message ?: "No se pudo cargar el perfil.")
            }
        } catch (e: Exception) {
            val result = ApiErrorHandler.mapThrowable(e)
            if (result.code == 401 || result.code == 403) {
                sessionManager.expireSession()
            }
            result
        }
    }

    suspend fun refresh(): ApiResult<ResidentAuthSession> {
        val currentRefreshToken = sessionManager.refreshToken ?: return ApiResult.Error("No existe sesión activa.")

        return try {
            val response = authApi.refresh(ResidentRefreshRequest(currentRefreshToken))
            if (response.success && response.data != null) {
                sessionManager.saveSession(
                    accessToken = response.data.accessToken,
                    refreshToken = response.data.refreshToken,
                    resident = response.data.resident ?: sessionManager.profile,
                )
                ApiResult.Success(response.data)
            } else {
                sessionManager.expireSession()
                ApiResult.Error(response.message ?: "La sesión expiró.")
            }
        } catch (e: Exception) {
            val result = ApiErrorHandler.mapThrowable(e)
            if (result.code == 401 || result.code == 403) {
                sessionManager.expireSession()
            }
            result
        }
    }

    suspend fun activate(token: String, password: String): ApiResult<ResidentProfile> {
        return try {
            val response = authApi.activate(ResidentActivateRequest(token, password))
            if (response.success && response.data != null) {
                ApiResult.Success(response.data)
            } else {
                ApiResult.Error(response.message ?: "No se pudo activar la cuenta.")
            }
        } catch (exception: Exception) {
            ApiErrorHandler.mapThrowable(exception)
        }
    }

    suspend fun requestPasswordRecovery(identifier: String, tenantSlug: String): ApiResult<Unit> {
        return try {
            val response = authApi.requestPasswordRecovery(
                ResidentPasswordRecoveryRequest(identifier.trim(), tenantSlug.trim()),
            )
            if (response.success) ApiResult.Success(Unit)
            else ApiResult.Error(response.message ?: "No se pudo solicitar la recuperación.")
        } catch (exception: Exception) {
            ApiErrorHandler.mapThrowable(exception)
        }
    }

    suspend fun resetPassword(token: String, newPassword: String): ApiResult<ResidentProfile> {
        return try {
            val response = authApi.resetPassword(ResidentPasswordResetRequest(token, newPassword))
            if (response.success && response.data != null) {
                ApiResult.Success(response.data)
            } else {
                ApiResult.Error(response.message ?: "No se pudo restablecer la contraseña.")
            }
        } catch (exception: Exception) {
            ApiErrorHandler.mapThrowable(exception)
        }
    }

    suspend fun changeAppPassword(
        identifier: String,
        tenantSlug: String,
        currentPassword: String,
        newPassword: String,
    ): ApiResult<ResidentProfile> {
        return try {
            val response = authApi.changeAppPassword(
                ResidentAppChangePasswordRequest(identifier, tenantSlug, currentPassword, newPassword),
            )
            if (response.success && response.data != null) {
                ApiResult.Success(response.data)
            } else {
                ApiResult.Error(response.message ?: "No se pudo cambiar la contraseña.")
            }
        } catch (exception: Exception) {
            ApiErrorHandler.mapThrowable(exception)
        }
    }

    fun logout() {
        sessionManager.clearSession()
    }
}
