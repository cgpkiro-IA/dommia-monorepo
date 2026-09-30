package com.dommia.resident.feature.notices

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.dommia.resident.core.model.ResidentNotice
import com.dommia.resident.core.network.ApiResult
import com.dommia.resident.core.session.ResidentContentRepository

@Composable
fun ResidentNoticesScreen(repository: ResidentContentRepository?) {
    var notices by remember { mutableStateOf<List<ResidentNotice>>(emptyList()) }
    var state by remember { mutableStateOf<NoticeState>(NoticeState.Loading) }
    var reloadKey by remember { mutableStateOf(0) }

    LaunchedEffect(repository, reloadKey) {
        if (repository == null) {
            state = NoticeState.Error("Los avisos aún no están conectados.")
            return@LaunchedEffect
        }

        state = NoticeState.Loading
        when (val result = repository.getNotices()) {
            is ApiResult.Success -> {
                notices = result.value
                state = NoticeState.Ready
            }
            is ApiResult.Error -> state = NoticeState.Error(result.message)
            is ApiResult.Loading -> state = NoticeState.Loading
        }
    }

    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        NoticeHeader(onRefresh = { reloadKey += 1 })
        when (val currentState = state) {
            NoticeState.Loading -> {
                CircularProgressIndicator()
                Text("Cargando avisos...")
            }
            NoticeState.Ready -> {
                if (notices.isEmpty()) {
                    Text("No hay avisos publicados para residentes.")
                } else {
                    notices.forEach { notice -> NoticeCard(notice) }
                }
            }
            is NoticeState.Error -> ErrorNotice(
                message = currentState.message,
                onRetry = { reloadKey += 1 },
            )
        }
    }
}

@Composable
private fun NoticeHeader(onRefresh: () -> Unit) {
    androidx.compose.foundation.layout.Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(
            text = "Avisos",
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.SemiBold,
        )
        TextButton(onClick = onRefresh) { Text("Actualizar") }
    }
}

@Composable
private fun NoticeCard(notice: ResidentNotice) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Text(
                text = notice.category ?: "Comunidad",
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.primary,
            )
            Text(
                text = notice.title,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
            )
            Text(text = notice.content, style = MaterialTheme.typography.bodyMedium)
            notice.authorName?.let {
                Text(
                    text = "Publicado por $it",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
}

@Composable
private fun ErrorNotice(message: String, onRetry: () -> Unit) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text(text = message, color = MaterialTheme.colorScheme.error)
            Button(onClick = onRetry) { Text("Reintentar") }
        }
    }
}

private sealed interface NoticeState {
    data object Loading : NoticeState
    data object Ready : NoticeState
    data class Error(val message: String) : NoticeState
}
