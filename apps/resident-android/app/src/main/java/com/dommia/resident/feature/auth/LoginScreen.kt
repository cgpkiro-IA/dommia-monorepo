package com.dommia.resident.feature.auth

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.dommia.resident.core.network.ApiClient
import com.dommia.resident.core.network.AuthApi
import com.dommia.resident.core.session.AuthRepository
import com.dommia.resident.core.session.SessionManager

@Composable
fun LoginScreen(
    sessionManager: SessionManager = SessionManager(androidx.compose.ui.platform.LocalContext.current.applicationContext as android.content.Context),
    bannerMessage: String? = null,
    authRepository: AuthRepository? = null,
    viewModel: LoginViewModel = viewModel {
        val repository = authRepository ?: AuthRepository(
            authApi = ApiClient.create(sessionManager).create(AuthApi::class.java),
            sessionManager = sessionManager,
        )
        LoginViewModel(
            authRepository = repository,
            sessionManager = sessionManager,
        )
    },
) {
    val state by viewModel.uiState.collectAsState()
    val effectiveError = bannerMessage ?: state.error
    var showRecovery by remember { mutableStateOf(false) }

    if (state.requiresPasswordChange) {
        ResidentInitialPasswordScreen(
            identifier = state.identifier,
            tenantSlug = state.tenantSlug,
            isLoading = state.isLoading,
            error = state.error,
            onSubmit = viewModel::changeInitialPassword,
        )
        return
    }

    if (showRecovery) {
        val repository = remember(sessionManager, authRepository) {
            authRepository ?: AuthRepository(
                authApi = ApiClient.create(sessionManager).create(AuthApi::class.java),
                sessionManager = sessionManager,
            )
        }
        ResidentPasswordRecoveryScreen(
            repository = repository,
            initialIdentifier = state.identifier,
            initialTenantSlug = state.tenantSlug,
            onBack = { showRecovery = false },
        )
        return
    }

    Surface(color = MaterialTheme.colorScheme.background) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                text = "DOMMIA Resident",
                style = MaterialTheme.typography.headlineLarge,
                modifier = Modifier.padding(bottom = 24.dp),
            )

            if (bannerMessage != null || state.error != null) {
                Text(
                    text = effectiveError ?: "",
                    color = if (bannerMessage != null) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.error,
                    modifier = Modifier.padding(bottom = 12.dp),
                )
            }

            OutlinedTextField(
                value = state.tenantSlug,
                onValueChange = viewModel::onTenantSlugChange,
                label = { Text("Tenant slug") },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 12.dp),
            )

            OutlinedTextField(
                value = state.identifier,
                onValueChange = viewModel::onIdentifierChange,
                label = { Text("Correo o teléfono") },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 12.dp),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
            )

            OutlinedTextField(
                value = state.password,
                onValueChange = viewModel::onPasswordChange,
                label = { Text("Contraseña") },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 12.dp),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                visualTransformation = PasswordVisualTransformation(),
            )

            if (state.error != null && bannerMessage == null) {
                Text(
                    text = state.error,
                    color = MaterialTheme.colorScheme.error,
                    modifier = Modifier.padding(bottom = 12.dp),
                )
            }

            Button(
                onClick = viewModel::login,
                enabled = !state.isLoading,
                modifier = Modifier.fillMaxWidth(),
            ) {
                if (state.isLoading) {
                    CircularProgressIndicator(strokeWidth = 2.dp)
                } else {
                    Text("Iniciar sesión")
                }
            }
            TextButton(
                onClick = { showRecovery = true },
                enabled = !state.isLoading,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text("¿Olvidaste tu contraseña?")
            }
        }
    }
}
