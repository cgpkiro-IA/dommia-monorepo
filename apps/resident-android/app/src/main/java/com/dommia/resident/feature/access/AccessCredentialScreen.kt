package com.dommia.resident.feature.access

import android.graphics.Bitmap
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.dommia.resident.core.model.AccessCredential
import com.dommia.resident.core.network.ApiResult
import com.dommia.resident.core.session.AccessRepository
import com.dommia.resident.core.session.SessionManager
import com.google.zxing.BarcodeFormat
import com.google.zxing.EncodeHintType
import com.google.zxing.MultiFormatWriter
import kotlinx.coroutines.delay

@Composable
fun AccessCredentialScreen(
    sessionManager: SessionManager,
    accessRepository: AccessRepository?,
) {
    var credential by remember { mutableStateOf<AccessCredential?>(null) }
    var state by remember { mutableStateOf<AccessState>(AccessState.Loading) }
    var reloadKey by remember { mutableStateOf(0) }

    LaunchedEffect(accessRepository, reloadKey) {
        if (accessRepository == null) {
            state = AccessState.Error("La credencial de acceso aún no está conectada.")
            return@LaunchedEffect
        }

        state = AccessState.Loading
        when (val result = accessRepository.getCredential()) {
            is ApiResult.Success -> {
                credential = result.value
                state = AccessState.Ready
            }
            is ApiResult.Error -> state = AccessState.Error(result.message)
            is ApiResult.Loading -> state = AccessState.Loading
        }
    }

    val currentCredential = credential
    Column(
        verticalArrangement = Arrangement.spacedBy(20.dp),
    ) {
        Text(
            text = "Credencial de acceso",
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.SemiBold,
        )

        when (val currentState = state) {
            AccessState.Loading -> LoadingCredential()
            AccessState.Ready -> {
                if (currentCredential != null) {
                    CredentialCard(currentCredential)
                    ExpirationCountdown(
                        credential = currentCredential,
                        onExpired = { reloadKey += 1 },
                    )
                }
            }
            is AccessState.Error -> ErrorCredential(
                message = currentState.message,
                onRetry = { reloadKey += 1 },
            )
        }

        Card(modifier = Modifier.fillMaxWidth()) {
            Column(
                modifier = Modifier.padding(18.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Text(
                    text = "Acceso conectado",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                )
                Text(
                    text = "El QR se obtiene del servidor y solo puede validarse mientras está vigente y la sesión del residente permanece activa.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Text(
                    text = "Propiedad: ${sessionManager.profile?.propertyId ?: "No asignada"}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
}

@Composable
private fun CredentialCard(credential: AccessCredential) {
    val qrBitmap = remember(credential.payload) { encodeQr(credential.payload) }

    Card(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Image(
                bitmap = qrBitmap.asImageBitmap(),
                contentDescription = "Código QR de acceso del residente",
                modifier = Modifier.size(240.dp),
            )
            Text(
                text = credential.code,
                style = MaterialTheme.typography.displaySmall,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary,
            )
        }
    }
}

@Composable
private fun ExpirationCountdown(
    credential: AccessCredential,
    onExpired: () -> Unit,
) {
    var remaining by remember(credential.payload) { mutableStateOf(credential.timeRemaining) }

    LaunchedEffect(credential.payload) {
        while (remaining > 0) {
            delay(1000)
            remaining -= 1
        }
        onExpired()
    }

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.Center,
    ) {
        Text(
            text = if (remaining > 0) "Vence en ${remaining}s" else "Actualizando credencial...",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

@Composable
private fun LoadingCredential() {
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        CircularProgressIndicator()
        Text("Obteniendo credencial segura...")
    }
}

@Composable
private fun ErrorCredential(message: String, onRetry: () -> Unit) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text(
                text = message,
                color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.bodyMedium,
            )
            Button(onClick = onRetry) {
                Text("Reintentar")
            }
        }
    }
}

private sealed interface AccessState {
    data object Loading : AccessState
    data object Ready : AccessState
    data class Error(val message: String) : AccessState
}

private fun encodeQr(payload: String): Bitmap {
    val matrix = MultiFormatWriter().encode(
        payload,
        BarcodeFormat.QR_CODE,
        768,
        768,
        mapOf(EncodeHintType.MARGIN to 1),
    )
    val bitmap = Bitmap.createBitmap(matrix.width, matrix.height, Bitmap.Config.ARGB_8888)
    for (x in 0 until matrix.width) {
        for (y in 0 until matrix.height) {
            bitmap.setPixel(x, y, if (matrix[x, y]) android.graphics.Color.BLACK else android.graphics.Color.WHITE)
        }
    }
    return bitmap
}
