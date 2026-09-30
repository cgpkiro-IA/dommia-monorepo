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
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.dommia.resident.core.session.AuthRepository

@Composable
fun ResidentInitialPasswordScreen(
    identifier: String,
    tenantSlug: String,
    isLoading: Boolean,
    error: String?,
    onSubmit: (currentPassword: String, newPassword: String) -> Unit,
) {
    var currentPassword by remember { mutableStateOf("") }
    var newPassword by remember { mutableStateOf("") }
    var confirmation by remember { mutableStateOf("") }
    var localError by remember { mutableStateOf<String?>(null) }

    Surface(color = MaterialTheme.colorScheme.background) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            verticalArrangement = Arrangement.Center,
        ) {
            Text("Actualiza tu contraseña", style = MaterialTheme.typography.headlineMedium)
            Text(
                text = "Tu cuenta requiere cambiar la contraseña temporal antes de continuar.",
                modifier = Modifier.padding(top = 8.dp, bottom = 20.dp),
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            OutlinedTextField(
                value = currentPassword,
                onValueChange = { currentPassword = it },
                label = { Text("Contraseña temporal") },
                modifier = Modifier.fillMaxWidth(),
                visualTransformation = PasswordVisualTransformation(),
            )
            OutlinedTextField(
                value = newPassword,
                onValueChange = { newPassword = it },
                label = { Text("Nueva contraseña") },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 12.dp),
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
            (localError ?: error)?.let {
                Text(
                    text = it,
                    modifier = Modifier.padding(top = 12.dp),
                    color = MaterialTheme.colorScheme.error,
                )
            }
            Button(
                onClick = {
                    localError = when {
                        currentPassword.isBlank() -> "Escribe tu contraseña temporal."
                        newPassword.length < 10 -> "La nueva contraseña debe tener al menos 10 caracteres."
                        newPassword != confirmation -> "Las contraseñas no coinciden."
                        else -> null
                    }
                    if (localError == null) onSubmit(currentPassword, newPassword)
                },
                enabled = !isLoading,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 20.dp),
            ) {
                if (isLoading) CircularProgressIndicator(strokeWidth = 2.dp) else Text("Actualizar contraseña")
            }
        }
    }
}
