package com.dommia.resident.feature.auth

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.dommia.resident.core.network.ApiResult
import com.dommia.resident.core.session.AuthRepository
import kotlinx.coroutines.launch

@Composable
fun ResidentPasswordRecoveryScreen(
    repository: AuthRepository,
    initialIdentifier: String,
    initialTenantSlug: String,
    onBack: () -> Unit,
) {
    var identifier by remember { mutableStateOf(initialIdentifier) }
    var tenantSlug by remember { mutableStateOf(initialTenantSlug) }
    var message by remember { mutableStateOf<String?>(null) }
    var isLoading by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    Surface(color = MaterialTheme.colorScheme.background) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            verticalArrangement = Arrangement.Center,
        ) {
            Text("Recuperar acceso", style = MaterialTheme.typography.headlineMedium)
            Text(
                text = "Te enviaremos instrucciones si la cuenta existe.",
                modifier = Modifier.padding(top = 8.dp, bottom = 20.dp),
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            OutlinedTextField(
                value = tenantSlug,
                onValueChange = { tenantSlug = it },
                label = { Text("Tenant slug") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
            )
            OutlinedTextField(
                value = identifier,
                onValueChange = { identifier = it },
                label = { Text("Correo o teléfono") },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 12.dp),
                singleLine = true,
            )
            message?.let {
                Text(
                    text = it,
                    modifier = Modifier.padding(top = 12.dp),
                    color = if (it.startsWith("Si las credenciales")) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error,
                )
            }
            Button(
                onClick = {
                    if (identifier.isBlank() || tenantSlug.isBlank()) {
                        message = "Completa el tenant y tu correo o teléfono."
                    } else {
                        scope.launch {
                            isLoading = true
                            message = null
                            when (val result = repository.requestPasswordRecovery(identifier, tenantSlug)) {
                                is ApiResult.Success -> message = "Si las credenciales existen, recibirás instrucciones para recuperar el acceso."
                                is ApiResult.Error -> message = result.message
                                is ApiResult.Loading -> Unit
                            }
                            isLoading = false
                        }
                    }
                },
                enabled = !isLoading,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 20.dp),
            ) {
                Text(if (isLoading) "Enviando..." else "Solicitar recuperación")
            }
            Button(
                onClick = onBack,
                enabled = !isLoading,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text("Volver al inicio de sesión")
            }
        }
    }
}
