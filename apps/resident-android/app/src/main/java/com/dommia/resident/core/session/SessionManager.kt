package com.dommia.resident.core.session

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.dommia.resident.core.model.ResidentProfile
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.serialization.json.Json
import java.util.UUID

class SessionManager(context: Context) {
    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val prefs = EncryptedSharedPreferences.create(
        "dommia_resident_session",
        MasterKey.DEFAULT_MASTER_KEY_ALIAS,
        context,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
    )

    private val json = Json {
        ignoreUnknownKeys = true
        explicitNulls = false
    }

    private val _state = MutableStateFlow<AuthState>(AuthState.LoggedOut)
    val state: StateFlow<AuthState> = _state.asStateFlow()

    val deviceId: String
        get() = prefs.getString("device_id", null) ?: UUID.randomUUID().toString().also {
            prefs.edit().putString("device_id", it).apply()
        }

    var accessToken: String?
        private set

    var refreshToken: String?
        private set

    var profile: ResidentProfile?
        private set

    init {
        restoreSession()
    }

    fun saveSession(accessToken: String, refreshToken: String, resident: ResidentProfile? = null) {
        val profileToPersist = resident ?: this.profile

        this.accessToken = accessToken
        this.refreshToken = refreshToken
        this.profile = profileToPersist

        val editor = prefs.edit()
            .putString("access_token", accessToken)
            .putString("refresh_token", refreshToken)

        if (profileToPersist != null) {
            editor.putString(
                "resident_profile",
                json.encodeToString(ResidentProfile.serializer(), profileToPersist),
            )
        } else {
            editor.remove("resident_profile")
        }

        editor.apply()
        _state.value = AuthState.Authenticated
    }

    fun updateProfile(resident: ResidentProfile) {
        this.profile = resident
        prefs.edit()
            .putString(
                "resident_profile",
                json.encodeToString(ResidentProfile.serializer(), resident),
            )
            .apply()
        _state.value = AuthState.Authenticated
    }

    fun restoreSession() {
        accessToken = prefs.getString("access_token", null)
        refreshToken = prefs.getString("refresh_token", null)
        profile = prefs.getString("resident_profile", null)?.let { rawProfile ->
            runCatching {
                json.decodeFromString(ResidentProfile.serializer(), rawProfile)
            }.getOrNull()
        }

        _state.value = when {
            accessToken != null && refreshToken != null -> AuthState.Authenticated
            accessToken != null || refreshToken != null -> AuthState.Expired
            else -> AuthState.LoggedOut
        }
    }

    fun clearSession() {
        accessToken = null
        refreshToken = null
        profile = null
        prefs.edit()
            .remove("access_token")
            .remove("refresh_token")
            .remove("resident_profile")
            .apply()
        _state.value = AuthState.LoggedOut
    }

    fun expireSession() {
        clearSession()
        _state.value = AuthState.Expired
    }

    fun setLoading(message: String = "") {
        _state.value = AuthState.Loading(message)
    }
}

sealed class AuthState {
    data object LoggedOut : AuthState()
    data object Authenticated : AuthState()
    data object Expired : AuthState()
    data class Loading(val message: String = "") : AuthState()
}
