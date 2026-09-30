package com.dommia.resident.feature.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.dommia.resident.core.model.ResidentProfile
import com.dommia.resident.core.network.ApiResult
import com.dommia.resident.core.session.AuthRepository
import com.dommia.resident.core.session.SessionManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class LoginViewModel(
    private val authRepository: AuthRepository,
    private val sessionManager: SessionManager,
) : ViewModel() {

    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()

    fun onIdentifierChange(value: String) {
        _uiState.value = _uiState.value.copy(identifier = value)
    }

    fun onPasswordChange(value: String) {
        _uiState.value = _uiState.value.copy(password = value)
    }

    fun onTenantSlugChange(value: String) {
        _uiState.value = _uiState.value.copy(tenantSlug = value)
    }

    fun login() {
        val identifier = _uiState.value.identifier.trim()
        val password = _uiState.value.password
        val tenantSlug = _uiState.value.tenantSlug.trim()

        if (identifier.isEmpty() || password.isEmpty() || tenantSlug.isEmpty()) {
            _uiState.value = _uiState.value.copy(error = "Completa los campos obligatorios.")
            return
        }

        _uiState.value = _uiState.value.copy(isLoading = true, error = null)

        viewModelScope.launch {
            when (val result = authRepository.login(identifier, password, tenantSlug)) {
                is ApiResult.Success -> {
                    if (result.value.passwordChangeRequired) {
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            error = null,
                            requiresPasswordChange = true,
                        )
                        return@launch
                    }
                    sessionManager.setLoading("Cargando perfil...")
                    when (val profileResult = authRepository.me()) {
                        is ApiResult.Success -> {
                            _uiState.value = _uiState.value.copy(
                                isLoading = false,
                                error = null,
                                profile = profileResult.value,
                            )
                        }
                        is ApiResult.Error -> {
                            _uiState.value = _uiState.value.copy(
                                isLoading = false,
                                error = profileResult.message,
                                profile = result.value.resident,
                            )
                        }
                        is ApiResult.Loading -> {
                            _uiState.value = _uiState.value.copy(
                                isLoading = true,
                                error = null,
                            )
                        }
                    }
                }
                is ApiResult.Error -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = result.message,
                    )
                }
                is ApiResult.Loading -> {
                    _uiState.value = _uiState.value.copy(
                        isLoading = true,
                        error = null,
                    )
                }
            }
        }
    }

    fun changeInitialPassword(currentPassword: String, newPassword: String) {
        val state = _uiState.value
        if (currentPassword.isBlank() || newPassword.length < 10 || state.identifier.isBlank() || state.tenantSlug.isBlank()) {
            _uiState.value = state.copy(error = "Completa los datos y usa una contraseña de al menos 10 caracteres.")
            return
        }

        _uiState.value = state.copy(isLoading = true, error = null)
        viewModelScope.launch {
            when (val result = authRepository.changeAppPassword(state.identifier, state.tenantSlug, currentPassword, newPassword)) {
                is ApiResult.Success -> _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = "Contraseña actualizada. Inicia sesión nuevamente.",
                    requiresPasswordChange = false,
                    password = "",
                )
                is ApiResult.Error -> _uiState.value = _uiState.value.copy(isLoading = false, error = result.message)
                is ApiResult.Loading -> Unit
            }
        }
    }
}

data class LoginUiState(
    val identifier: String = "",
    val password: String = "",
    val tenantSlug: String = "",
    val isLoading: Boolean = false,
    val error: String? = null,
    val profile: ResidentProfile? = null,
    val requiresPasswordChange: Boolean = false,
)
