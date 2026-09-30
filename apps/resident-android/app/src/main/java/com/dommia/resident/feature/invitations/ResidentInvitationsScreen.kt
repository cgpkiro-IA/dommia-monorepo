package com.dommia.resident.feature.invitations

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.dommia.resident.core.model.CreateVisitorPassRequest
import com.dommia.resident.core.model.VisitorPass
import com.dommia.resident.core.network.ApiResult
import com.dommia.resident.core.session.ResidentContentRepository
import kotlinx.coroutines.launch

@Composable
fun ResidentInvitationsScreen(repository: ResidentContentRepository?) {
    var passes by remember { mutableStateOf<List<VisitorPass>>(emptyList()) }
    var state by remember { mutableStateOf<InvitationState>(InvitationState.Loading) }
    var reloadKey by remember { mutableStateOf(0) }
    var visitorName by remember { mutableStateOf("") }
    var passType by remember { mutableStateOf("TEMPORARY") }
    var validDays by remember { mutableStateOf("7") }
    var notes by remember { mutableStateOf("") }
    var formMessage by remember { mutableStateOf<String?>(null) }
    var submitting by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(repository, reloadKey) {
        if (repository == null) {
            state = InvitationState.Error("Los pases aún no están conectados.")
            return@LaunchedEffect
        }

        state = InvitationState.Loading
        when (val result = repository.getVisitorPasses()) {
            is ApiResult.Success -> {
                passes = result.value
                state = InvitationState.Ready
            }
            is ApiResult.Error -> state = InvitationState.Error(result.message)
            is ApiResult.Loading -> state = InvitationState.Loading
        }
    }

    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Text("Pases de visita", style = MaterialTheme.typography.headlineSmall)
            TextButton(onClick = { reloadKey += 1 }) { Text("Actualizar") }
        }

        CreatePassCard(
            visitorName = visitorName,
            onVisitorNameChange = { visitorName = it },
            passType = passType,
            onPassTypeChange = { passType = it },
            validDays = validDays,
            onValidDaysChange = { validDays = it.filter(Char::isDigit).take(2) },
            notes = notes,
            onNotesChange = { notes = it },
            submitting = submitting,
            message = formMessage,
            onCreate = {
                val days = validDays.toIntOrNull()
                if (visitorName.trim().length < 2) {
                    formMessage = "Escribe el nombre del visitante."
                } else if (days == null || days !in 1..30) {
                    formMessage = "La vigencia debe estar entre 1 y 30 días."
                } else if (repository == null) {
                    formMessage = "Los pases aún no están disponibles."
                } else {
                    scope.launch {
                        submitting = true
                        formMessage = null
                        when (val result = repository.createVisitorPass(CreateVisitorPassRequest(visitorName.trim(), passType, days, notes.trim().ifBlank { null }))) {
                            is ApiResult.Success -> {
                                visitorName = ""
                                notes = ""
                                formMessage = "Pase creado correctamente."
                                reloadKey += 1
                            }
                            is ApiResult.Error -> formMessage = result.message
                            is ApiResult.Loading -> Unit
                        }
                        submitting = false
                    }
                }
            },
        )

        when (val currentState = state) {
            InvitationState.Loading -> Text("Cargando pases...")
            InvitationState.Ready -> {
                if (passes.isEmpty()) Text("No tienes pases de visita.")
                passes.forEach { pass ->
                    VisitorPassCard(
                        pass = pass,
                        onRevoke = {
                            if (repository != null) {
                                scope.launch {
                                    when (repository.revokeVisitorPass(pass.id)) {
                                        is ApiResult.Success -> reloadKey += 1
                                        else -> Unit
                                    }
                                }
                            }
                        },
                    )
                }
            }
            is InvitationState.Error -> ErrorPass(currentState.message) { reloadKey += 1 }
        }
    }
}

@Composable
private fun CreatePassCard(
    visitorName: String,
    onVisitorNameChange: (String) -> Unit,
    passType: String,
    onPassTypeChange: (String) -> Unit,
    validDays: String,
    onValidDaysChange: (String) -> Unit,
    notes: String,
    onNotesChange: (String) -> Unit,
    submitting: Boolean,
    message: String?,
    onCreate: () -> Unit,
) {
    var menuExpanded by remember { mutableStateOf(false) }
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Text("Crear pase", style = MaterialTheme.typography.titleMedium)
            OutlinedTextField(
                value = visitorName,
                onValueChange = onVisitorNameChange,
                label = { Text("Nombre del visitante") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
            )
            androidx.compose.foundation.layout.Box {
                OutlinedTextField(
                    value = passTypeLabel(passType),
                    onValueChange = {},
                    label = { Text("Tipo de pase") },
                    modifier = Modifier.fillMaxWidth(),
                    readOnly = true,
                )
                DropdownMenu(
                    expanded = menuExpanded,
                    onDismissRequest = { menuExpanded = false },
                ) {
                    listOf("SINGLE_USE", "TEMPORARY", "FREQUENT").forEach { type ->
                        DropdownMenuItem(
                            text = { Text(passTypeLabel(type)) },
                            onClick = {
                                onPassTypeChange(type)
                                menuExpanded = false
                            },
                        )
                    }
                }
                TextButton(onClick = { menuExpanded = true }, modifier = Modifier.matchParentSize()) { }
            }
            OutlinedTextField(
                value = validDays,
                onValueChange = onValidDaysChange,
                label = { Text("Vigencia en días") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
            )
            OutlinedTextField(
                value = notes,
                onValueChange = onNotesChange,
                label = { Text("Notas opcionales") },
                modifier = Modifier.fillMaxWidth(),
                minLines = 2,
            )
            Button(onClick = onCreate, enabled = !submitting, modifier = Modifier.fillMaxWidth()) {
                Text(if (submitting) "Creando..." else "Crear pase")
            }
            message?.let { Text(it, color = MaterialTheme.colorScheme.primary) }
        }
    }
}

@Composable
private fun VisitorPassCard(pass: VisitorPass, onRevoke: () -> Unit) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                Text(pass.visitorName, style = MaterialTheme.typography.titleMedium)
                Text(passStatusLabel(pass.status), color = statusColor(pass.status))
            }
            Text("Tipo: ${passTypeLabel(pass.passType)}")
            Text("Vigencia: ${pass.validFrom} a ${pass.validUntil}")
            pass.notes?.let { Text(it, color = MaterialTheme.colorScheme.onSurfaceVariant) }
            if (pass.status == "ACTIVE") {
                TextButton(onClick = onRevoke) { Text("Revocar pase") }
            }
        }
    }
}

@Composable
private fun ErrorPass(message: String, onRetry: () -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(message, color = MaterialTheme.colorScheme.error)
        Button(onClick = onRetry) { Text("Reintentar") }
    }
}

private fun passTypeLabel(type: String) = when (type) {
    "SINGLE_USE" -> "Un solo uso"
    "FREQUENT" -> "Frecuente"
    else -> "Temporal"
}

private fun passStatusLabel(status: String) = when (status) {
    "EXPIRED" -> "Vencido"
    "REVOKED" -> "Revocado"
    "USED" -> "Utilizado"
    else -> "Activo"
}

@Composable
private fun statusColor(status: String) = when (status) {
    "ACTIVE" -> MaterialTheme.colorScheme.primary
    else -> MaterialTheme.colorScheme.onSurfaceVariant
}

private sealed interface InvitationState {
    data object Loading : InvitationState
    data object Ready : InvitationState
    data class Error(val message: String) : InvitationState
}
