package com.dommia.resident.feature.home

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material.icons.outlined.AccountCircle
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material.icons.outlined.QrCodeScanner
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.dommia.resident.core.model.ResidentProfile
import com.dommia.resident.core.network.ApiResult
import com.dommia.resident.core.session.AuthRepository
import com.dommia.resident.core.session.AccessRepository
import com.dommia.resident.core.session.ResidentContentRepository
import com.dommia.resident.core.session.ResidentOperationsRepository
import com.dommia.resident.core.session.ResidentFinanceRepository
import com.dommia.resident.core.session.SessionManager
import com.dommia.resident.feature.access.AccessCredentialScreen
import com.dommia.resident.feature.invitations.ResidentInvitationsScreen
import com.dommia.resident.feature.notices.ResidentNoticesScreen

private enum class ResidentHomeTab {
    HOME,
    ACCESS,
    NOTICES,
    INVITATIONS,
    PROFILE,
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ResidentHomeScreen(
    sessionManager: SessionManager,
    authRepository: AuthRepository? = null,
    accessRepository: AccessRepository? = null,
    contentRepository: ResidentContentRepository? = null,
    operationsRepository: ResidentOperationsRepository? = null,
    financeRepository: ResidentFinanceRepository? = null,
) {
    val resident = sessionManager.profile
    val displayName = resident?.let {
        "${it.firstName} ${it.lastName}".trim()
    } ?: "Residente"

    LaunchedEffect(resident, authRepository) {
        if (authRepository != null && resident == null && sessionManager.accessToken != null) {
            when (val result = authRepository.me()) {
                is ApiResult.Error -> {
                    if (result.code == 401 || result.code == 403) {
                        sessionManager.clearSession()
                    }
                }
                else -> Unit
            }
        }
    }

    val tabs = listOf(
        "Inicio" to ResidentHomeTab.HOME to Icons.Filled.Home to Icons.Outlined.Home,
        "Credencial" to ResidentHomeTab.ACCESS to Icons.Filled.QrCodeScanner to Icons.Outlined.QrCodeScanner,
        "Circulares" to ResidentHomeTab.NOTICES to Icons.Filled.Notifications to Icons.Outlined.Notifications,
        "Pases" to ResidentHomeTab.INVITATIONS to Icons.Filled.Add to Icons.Outlined.Add,
        "Perfil" to ResidentHomeTab.PROFILE to Icons.Filled.AccountCircle to Icons.Outlined.AccountCircle,
    )

    var selectedTab by remember { mutableStateOf(ResidentHomeTab.HOME) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text("DOMMIA", fontWeight = FontWeight.ExtraBold)
                        Text(
                            "Resident",
                            color = MaterialTheme.colorScheme.primary,
                            style = MaterialTheme.typography.labelLarge,
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.94f),
                    titleContentColor = MaterialTheme.colorScheme.onSurface,
                ),
                actions = {
                    TextButton(onClick = { sessionManager.clearSession() }) {
                        Text("Salir", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                },
            )
        },
        bottomBar = {
            NavigationBar(
                containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.96f),
                tonalElevation = 0.dp,
            ) {
                tabs.forEach { (label, tab, selectedIcon, unselectedIcon) ->
                    NavigationBarItem(
                        selected = selectedTab == tab,
                        onClick = { selectedTab = tab },
                        icon = {
                            Icon(
                                imageVector = if (selectedTab == tab) selectedIcon else unselectedIcon,
                                contentDescription = label,
                            )
                        },
                        label = { Text(label) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = MaterialTheme.colorScheme.primary,
                            selectedTextColor = MaterialTheme.colorScheme.primary,
                            indicatorColor = MaterialTheme.colorScheme.secondaryContainer,
                            unselectedIconColor = MaterialTheme.colorScheme.onSurfaceVariant,
                            unselectedTextColor = MaterialTheme.colorScheme.onSurfaceVariant,
                        ),
                    )
                }
            }
        },
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 20.dp, vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp),
        ) {
            when (selectedTab) {
                ResidentHomeTab.HOME -> HomeOverview(displayName, operationsRepository, financeRepository)
                ResidentHomeTab.ACCESS -> AccessCredentialScreen(
                    sessionManager = sessionManager,
                    accessRepository = accessRepository,
                )
                ResidentHomeTab.NOTICES -> ResidentNoticesScreen(contentRepository)
                ResidentHomeTab.INVITATIONS -> ResidentInvitationsScreen(contentRepository)
                ResidentHomeTab.PROFILE -> ProfileSection(resident, sessionManager)
            }
        }
    }
}

@Composable
private fun HomeOverview(
    displayName: String,
    operationsRepository: ResidentOperationsRepository?,
    financeRepository: ResidentFinanceRepository?,
) {
    Column(
        verticalArrangement = Arrangement.spacedBy(20.dp),
    ) {
        Text(
            text = "Bienvenido",
            style = MaterialTheme.typography.headlineSmall,
        )

        Text(
            text = displayName,
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.SemiBold,
        )

        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            border = CardDefaults.outlinedCardBorder().copy(
                brush = androidx.compose.ui.graphics.Brush.linearGradient(
                    listOf(
                        MaterialTheme.colorScheme.outline.copy(alpha = 0.85f),
                        MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.55f),
                    ),
                ),
            ),
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Text(
                    text = "Estado de sesión",
                    style = MaterialTheme.typography.titleMedium,
                )
                Text(
                    text = "La sesión móvil está activa y la app ya restaura el perfil autenticado al iniciar.",
                    style = MaterialTheme.typography.bodyMedium,
                )
            }
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            SummaryCard(title = "QR", value = "Listo")
            SummaryCard(title = "Avisos", value = "3")
            SummaryCard(title = "Perfil", value = "OK")
        }

        ResidentOperationsSection(operationsRepository)
        ResidentFinanceSection(financeRepository)

        BlockedSection(
            title = "Módulos bloqueados por backend",
            description = "Las finanzas y los recibos siguen condicionados a la autorización del backend y a la derivación correcta de tenant/property desde la sesión.",
        )
    }
}

@Composable
private fun ProfileSection(
    resident: ResidentProfile?,
    sessionManager: SessionManager,
) {
    val propertyAddress = resident?.let {
        listOfNotNull(
            it.street?.takeIf(String::isNotBlank),
            it.exteriorNumber?.takeIf(String::isNotBlank)?.let { number -> "#${number}" },
            it.interiorNumber?.takeIf(String::isNotBlank)?.let { number -> "int. ${number}" },
        ).joinToString(" ").ifBlank { null }
    }

    Column(
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Text(
            text = "Perfil",
            style = MaterialTheme.typography.headlineSmall,
        )

        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            border = CardDefaults.outlinedCardBorder(),
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Text(
                    text = resident?.let {
                        "${it.firstName} ${it.lastName}".trim()
                    } ?: "Residente",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.SemiBold,
                )
                Text(text = resident?.email ?: "Sin email")
                Text(text = "Rol: ${resident?.role ?: "RESIDENT"}")
                Text(text = if (resident?.isPrimary == true) "Titular principal" else "Residente autorizado")
                Text(text = "Teléfono: ${resident?.phone ?: "Sin teléfono"}")
                Text(text = "Dirección: ${propertyAddress ?: "No disponible"}")
                Text(text = "Manzana: ${resident?.block ?: "No disponible"}")
                Text(text = "Lote: ${resident?.lot ?: "No disponible"}")
                Text(text = "ID de vivienda: ${resident?.propertyId ?: "No asignada"}")
                Text(text = if (resident?.isActive == true) "Estado: activo" else "Estado: inactivo")
                if (resident?.mustChangePassword == true) {
                    Text(
                        text = "Debes actualizar tu contraseña.",
                        color = MaterialTheme.colorScheme.error,
                    )
                }
                Text(text = "Dispositivo: Android Resident")
            }
        }

        Button(
            onClick = { sessionManager.clearSession() },
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text("Cerrar sesión")
        }
    }
}

@Composable
private fun BlockedSection(
    title: String,
    description: String,
) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Icon(
                    imageVector = Icons.Filled.Info,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                )
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium,
                )
            }
            Text(
                text = description,
                style = MaterialTheme.typography.bodyMedium,
            )
        }
    }
}

@Composable
private fun SummaryCard(
    title: String,
    value: String,
) {
    Card(
        modifier = Modifier.weight(1f),
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            Text(
                text = title,
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Text(
                text = value,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
            )
        }
    }
}
