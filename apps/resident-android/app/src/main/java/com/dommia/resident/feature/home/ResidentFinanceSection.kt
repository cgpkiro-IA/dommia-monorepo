package com.dommia.resident.feature.home

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.ui.platform.LocalContext
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
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.dommia.resident.core.model.AnnualCampaign
import com.dommia.resident.core.model.FinancialStatus
import com.dommia.resident.core.model.MonthlyFinancialReport
import com.dommia.resident.core.model.MonthlyReportEvidence
import com.dommia.resident.core.network.ApiResult
import com.dommia.resident.core.session.ResidentFinanceRepository
import java.text.NumberFormat
import java.util.Locale
import kotlinx.coroutines.launch

@Composable
fun ResidentFinanceSection(repository: ResidentFinanceRepository?) {
    var status by remember { mutableStateOf<FinancialStatus?>(null) }
    var campaigns by remember { mutableStateOf<List<AnnualCampaign>>(emptyList()) }
    var monthlyReports by remember { mutableStateOf<List<MonthlyFinancialReport>>(emptyList()) }
    var state by remember { mutableStateOf<FinanceState>(FinanceState.Loading) }
    var reloadKey by remember { mutableStateOf(0) }
    var reportActionMessage by remember { mutableStateOf<String?>(null) }
    var pendingEvidence by remember { mutableStateOf<MonthlyReportEvidence?>(null) }
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val evidenceSaver = rememberLauncherForActivityResult(ActivityResultContracts.CreateDocument("application/octet-stream")) { uri ->
        val evidence = pendingEvidence
        pendingEvidence = null
        if (uri != null && evidence != null && repository != null) {
            coroutineScope.launch {
                when (val result = repository.downloadMonthlyEvidence(evidence.id)) {
                    is ApiResult.Success -> {
                        val saved = runCatching {
                            context.contentResolver.openOutputStream(uri)?.use { it.write(result.value) } ?: error("No se pudo guardar el archivo.")
                        }.isSuccess
                        reportActionMessage = if (saved) "Evidencia guardada." else "No se pudo guardar la evidencia."
                    }
                    is ApiResult.Error -> reportActionMessage = result.message
                    is ApiResult.Loading -> Unit
                }
            }
        }
    }

    LaunchedEffect(repository, reloadKey) {
        if (repository == null) {
            state = FinanceState.Error("Finanzas aún no están conectadas.")
            return@LaunchedEffect
        }
        state = FinanceState.Loading
        when (val statusResult = repository.getStatus()) {
            is ApiResult.Success -> {
                status = statusResult.value
                when (val campaignsResult = repository.getCampaigns()) {
                    is ApiResult.Success -> {
                        campaigns = campaignsResult.value
                        when (val reportsResult = repository.getMonthlyReports()) {
                            is ApiResult.Success -> {
                                monthlyReports = reportsResult.value
                                state = FinanceState.Ready
                            }
                            is ApiResult.Error -> state = FinanceState.Error(reportsResult.message)
                            is ApiResult.Loading -> Unit
                        }
                    }
                    is ApiResult.Error -> state = FinanceState.Error(campaignsResult.message)
                    is ApiResult.Loading -> Unit
                }
            }
            is ApiResult.Error -> state = FinanceState.Error(statusResult.message)
            is ApiResult.Loading -> Unit
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
                Column {
                    Text("Mis cuotas", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Text("Estado financiero de tu vivienda", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                TextButton(onClick = { reloadKey += 1 }) { Text("Actualizar") }
            }
            when (val currentState = state) {
                FinanceState.Loading -> {
                    CircularProgressIndicator(strokeWidth = 2.dp)
                    Text("Consultando estado financiero...")
                }
                FinanceState.Ready -> {
                    val currentStatus = status
                    if (currentStatus != null) {
                        Text(
                            text = accountStatusLabel(currentStatus.accountStatus),
                            color = if (currentStatus.accountStatus == "UP_TO_DATE") MaterialTheme.colorScheme.tertiary else MaterialTheme.colorScheme.error,
                            fontWeight = FontWeight.Bold,
                        )
                        Text("Saldo pendiente: ${formatMoney(currentStatus.totalBalanceDue)}")
                        Text("Pagado acumulado: ${formatMoney(currentStatus.totalPaid)}", color = MaterialTheme.colorScheme.onSurfaceVariant)
                        if (currentStatus.pendingChargesCount > 0) {
                            Text("Cargos pendientes: ${currentStatus.pendingChargesCount}")
                        }
                    }
                    if (campaigns.isNotEmpty()) {
                        Text("Campañas activas", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                        campaigns.take(3).forEach { campaign ->
                            Text("${campaign.name} · ${campaign.discountPercentage}% de descuento")
                        }
                    }
                    if (monthlyReports.isNotEmpty()) {
                        Text("Rendiciones mensuales", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                        monthlyReports.take(3).forEach { report ->
                            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                Text(report.periodStart.take(7), fontWeight = FontWeight.SemiBold)
                                Text(
                                    "Ingresos ${formatMoney(report.snapshot.income.total)} · Egresos ${formatMoney(report.snapshot.expenses.total)} · Saldo ${formatMoney(report.snapshot.closing.reportedTotal)}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                                Text(
                                    if (report.reviewedByCurrentResident) "Revisado" else "Consulta opcional",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.tertiary,
                                )
                                report.snapshot.income.regular.forEach { income ->
                                    Text("${income.category} · ${income.paymentMethod}: ${formatMoney(income.amount)}", style = MaterialTheme.typography.bodySmall)
                                }
                                report.snapshot.reportEvidence.forEach { evidence ->
                                    TextButton(onClick = { pendingEvidence = evidence; evidenceSaver.launch(evidence.fileName) }) {
                                        Text("Descargar ${evidence.fileName}")
                                    }
                                }
                                report.snapshot.expenses.items.forEach { expense ->
                                    Text("${expense.description}: ${formatMoney(expense.amount)}", style = MaterialTheme.typography.bodySmall)
                                    expense.evidence.forEach { evidence ->
                                        TextButton(onClick = { pendingEvidence = evidence; evidenceSaver.launch(evidence.fileName) }) {
                                            Text("Descargar ${evidence.fileName}")
                                        }
                                    }
                                }
                                if (!report.reviewedByCurrentResident) {
                                    TextButton(onClick = {
                                        coroutineScope.launch {
                                            when (val result = repository.markMonthlyReportReviewed(report.id)) {
                                                is ApiResult.Success -> monthlyReports = monthlyReports.map { if (it.id == report.id) it.copy(reviewedByCurrentResident = true) else it }
                                                is ApiResult.Error -> reportActionMessage = result.message
                                                is ApiResult.Loading -> Unit
                                            }
                                        }
                                    }) { Text("Marcar revisión opcional") }
                                }
                            }
                        }
                    }
                    reportActionMessage?.let { Text(it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant) }
                    Text(
                        "El envío de comprobantes estará disponible cuando el backend habilite upload seguro e idempotencia.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                is FinanceState.Error -> {
                    Text(currentState.message, color = MaterialTheme.colorScheme.error)
                    Button(onClick = { reloadKey += 1 }) { Text("Reintentar") }
                }
            }
        }
    }
}

private fun formatMoney(value: Double): String = NumberFormat.getCurrencyInstance(Locale("es", "MX")).format(value)

private fun accountStatusLabel(status: String): String = when (status) {
    "UP_TO_DATE" -> "Cuenta al corriente"
    "CREDIT_BALANCE" -> "Saldo a favor"
    "OVERDUE" -> "Saldo pendiente"
    else -> "Estado financiero disponible"
}

private sealed interface FinanceState {
    data object Loading : FinanceState
    data object Ready : FinanceState
    data class Error(val message: String) : FinanceState
}
