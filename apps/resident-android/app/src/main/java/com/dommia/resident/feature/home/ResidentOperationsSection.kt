package com.dommia.resident.feature.home

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
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
import com.dommia.resident.core.model.ActiveDelivery
import com.dommia.resident.core.model.ActiveService
import com.dommia.resident.core.model.ResidentOperations
import com.dommia.resident.core.network.ApiResult
import com.dommia.resident.core.session.ResidentOperationsRepository

@Composable
fun ResidentOperationsSection(repository: ResidentOperationsRepository?) {
    var operations by remember { mutableStateOf(ResidentOperations()) }
    var state by remember { mutableStateOf<OperationsState>(OperationsState.Loading) }
    var reloadKey by remember { mutableStateOf(0) }

    LaunchedEffect(repository, reloadKey) {
        if (repository == null) {
            state = OperationsState.Error("La actividad de acceso no está conectada.")
            return@LaunchedEffect
        }
        state = OperationsState.Loading
        when (val result = repository.getOperations()) {
            is ApiResult.Success -> {
                operations = result.value
                state = OperationsState.Ready
            }
            is ApiResult.Error -> state = OperationsState.Error(result.message)
            is ApiResult.Loading -> state = OperationsState.Loading
        }
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = CardDefaults.outlinedCardBorder(),
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Text("Actividad de acceso", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Text("Servicios y entregas de tu vivienda", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                TextButton(onClick = { reloadKey += 1 }) { Text("Actualizar") }
            }
            when (val currentState = state) {
                OperationsState.Loading -> {
                    CircularProgressIndicator(strokeWidth = 2.dp)
                    Text("Consultando actividad segura...")
                }
                OperationsState.Ready -> {
                    if (operations.services.isEmpty() && operations.deliveries.isEmpty()) {
                        Text("No hay servicios ni entregas pendientes.", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    } else {
                        operations.services.forEach { ServiceRow(it) }
                        operations.deliveries.forEach { DeliveryRow(it) }
                    }
                }
                is OperationsState.Error -> {
                    Text(currentState.message, color = MaterialTheme.colorScheme.error)
                    Button(onClick = { reloadKey += 1 }) { Text("Reintentar") }
                }
            }
        }
    }
}

@Composable
private fun ServiceRow(service: ActiveService) {
    Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
        Text(serviceLabel(service), fontWeight = FontWeight.SemiBold)
        Text(
            text = listOfNotNull(service.supplierName, service.vehiclePlates, service.notes).joinToString(" · ").ifBlank { "En tránsito" },
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

@Composable
private fun DeliveryRow(delivery: ActiveDelivery) {
    Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
        Text("Paquete para ${delivery.recipientName}", fontWeight = FontWeight.SemiBold)
        Text(
            text = listOfNotNull(delivery.carrier, delivery.trackingCode, delivery.notes).joinToString(" · ").ifBlank { "Pendiente de entrega" },
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

private fun serviceLabel(service: ActiveService): String = when (service.serviceType) {
    "FOOD_DELIVERY" -> "Entrega de alimentos"
    "GAS_SUPPLY" -> "Suministro de gas"
    "WATER_SUPPLY" -> "Suministro de agua"
    "PARCEL_COURIER" -> "Paquetería"
    "TAXI_RIDE" -> "Taxi o transporte"
    "MAINTENANCE" -> "Mantenimiento"
    else -> service.customServiceName ?: "Servicio en tránsito"
}

private sealed interface OperationsState {
    data object Loading : OperationsState
    data object Ready : OperationsState
    data class Error(val message: String) : OperationsState
}
