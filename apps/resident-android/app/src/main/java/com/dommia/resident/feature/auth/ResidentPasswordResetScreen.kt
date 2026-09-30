package com.dommia.resident.feature.auth

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
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
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.dommia.resident.core.network.ApiResult
import com.dommia.resident.core.session.AuthRepository
import kotlinx.coroutines.launch

@Composable
fun ResidentPasswordResetScreen(
    repository: AuthRepository,
    resetToken: String,
    onCompleted: () -> Unit,
) {
    var password by remember { mutableStateOf("") }
    var confirmation by remember { mutableStateOf("") }
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
            Text("Restablecer contraseña", style = MaterialTheme.typography.headlineMedium)
            Text(
                text = "Define una nueva contraseña para tu cuenta Resident.",
                modifier = Modifier.padding(top = 8.dp, bottom = 20.dp),
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            OutlinedTextField(
                value = password,
                onValueChange = { password = it },
                label = { Text("Nueva contraseña") },
                modifier = Modifier.fillMaxWidth(),
                visualTransformation = PasswordVisualTransformation(),
            )
            OutlinedTextField(
                value = confirmation,
                onValueChange = { confirmation = it },
                label = { Text("Confirmar contraseña") },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 12.dp),
                visualTransformation = PasswordVisualTransformation(),
            )
            message?.let {
                Text(
                    text = it,
                    modifier = Modifier.padding(top = 12.dp),
                    color = if (it.startsWith("Contraseña actualizada")) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error,
                )
            }
            Button(
                onClick = {
                    when {
                        password.length < 10 -> message = "La contraseña debe tener al menos 10 caracteres."
                        password != confirmation -> message = "Las contraseñas no coinciden."
                        else -> scope.launch {
                            isLoading = true
                            message = null
                            when (val result = repository.resetPassword(resetToken, password)) {
                                is ApiResult.Success -> {
                                    message = "Contraseña actualizada correctamente."
                                    isLoading = false
                                    onCompleted()
                                }
                                is ApiResult.Error -> {
                                    message = result.message
                                    isLoading = false
                                }
                                is ApiResult.Loading -> Unit
                            }
                        }
                    }
                },
                enabled = !isLoading,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 20.dp),
            ) {
                if (isLoading) CircularProgressIndicator(strokeWidth = 2.dp) else Text("Guardar contraseña")
            }
        }
    }
}
