package com.dommia.resident.feature.home

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.graphics.Bitmap
import android.widget.Toast
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.dommia.resident.core.model.AccessCredential
import com.dommia.resident.core.model.ActiveDelivery
import com.dommia.resident.core.model.ActiveService
import com.dommia.resident.core.model.AnnualCampaign
import com.dommia.resident.core.model.CreateVisitorPassRequest
import com.dommia.resident.core.model.FinancialStatus
import com.dommia.resident.core.model.ResidentNotice
import com.dommia.resident.core.model.ResidentOperations
import com.dommia.resident.core.model.ResidentProfile
import com.dommia.resident.core.model.VisitorPass
import com.dommia.resident.core.network.ApiResult
import com.dommia.resident.core.session.AccessRepository
import com.dommia.resident.core.session.AuthRepository
import com.dommia.resident.core.session.ResidentContentRepository
import com.dommia.resident.core.session.ResidentFinanceRepository
import com.dommia.resident.core.session.ResidentOperationsRepository
import com.dommia.resident.core.session.SessionManager
import com.google.zxing.BarcodeFormat
import com.google.zxing.EncodeHintType
import com.google.zxing.MultiFormatWriter
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.text.NumberFormat
import java.util.Locale

// Tab Keys matching resident-pwa
enum class TabKey {
    CREDENTIAL,
    PASSES,
    NOTICES,
    FINANCE,
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
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val resident = sessionManager.profile
    val tenantSlug = "guard-qa"

    var activeTab by remember { mutableStateOf(TabKey.CREDENTIAL) }

    // Real-time access credential & alerts state
    var credential by remember { mutableStateOf<AccessCredential?>(null) }
    var activeServices by remember { mutableStateOf<List<ActiveService>>(emptyList()) }
    var activeDeliveries by remember { mutableStateOf<List<ActiveDelivery>>(emptyList()) }
    var dismissedDeliveries by remember { mutableStateOf<Set<String>>(emptySet()) }
    var dismissedServices by remember { mutableStateOf<Set<String>>(emptySet()) }

    // Notices state
    var notices by remember { mutableStateOf<List<ResidentNotice>>(emptyList()) }

    // Visitor Passes state
    var passes by remember { mutableStateOf<List<VisitorPass>>(emptyList()) }
    var selectedPassForShare by remember { mutableStateOf<VisitorPass?>(null) }
    var showQuickInviteModal by remember { mutableStateOf(false) }

    // Modals state
    var showQRModal by remember { mutableStateOf(false) }
    var showSpeiModal by remember { mutableStateOf(false) }

    // Finance state
    var financialStatus by remember { mutableStateOf<FinancialStatus?>(null) }
    var campaigns by remember { mutableStateOf<List<AnnualCampaign>>(emptyList()) }

    // Polling & Initial Loading
    LaunchedEffect(accessRepository, operationsRepository, contentRepository, financeRepository, sessionManager.accessToken) {
        if (sessionManager.accessToken == null) return@LaunchedEffect

        // 1. Fetch Profile if null
        if (resident == null && authRepository != null) {
            authRepository.me()
        }

        // 2. Fetch Initial Credential
        if (accessRepository != null) {
            val res = accessRepository.getCredential()
            if (res is ApiResult.Success) credential = res.value
        }

        // 3. Fetch Operations (Active Services & Deliveries)
        if (operationsRepository != null) {
            val opsRes = operationsRepository.getOperations()
            if (opsRes is ApiResult.Success) {
                activeServices = opsRes.value.services
                activeDeliveries = opsRes.value.deliveries
            }
        }

        // 4. Fetch Notices & Passes
        if (contentRepository != null) {
            val noticesRes = contentRepository.getNotices()
            if (noticesRes is ApiResult.Success) notices = noticesRes.value

            val passesRes = contentRepository.getVisitorPasses()
            if (passesRes is ApiResult.Success) passes = passesRes.value
        }

        // 5. Fetch Finance
        if (financeRepository != null) {
            val statusRes = financeRepository.getStatus()
            if (statusRes is ApiResult.Success) financialStatus = statusRes.value

            val campaignsRes = financeRepository.getCampaigns()
            if (campaignsRes is ApiResult.Success) campaigns = campaignsRes.value
        }
    }

    // Periodic Refresh for Real-time Access Alerts (Every 10s)
    LaunchedEffect(operationsRepository, accessRepository) {
        while (true) {
            delay(10000)
            if (sessionManager.accessToken != null) {
                if (accessRepository != null) {
                    val res = accessRepository.getCredential()
                    if (res is ApiResult.Success) credential = res.value
                }
                if (operationsRepository != null) {
                    val opsRes = operationsRepository.getOperations()
                    if (opsRes is ApiResult.Success) {
                        activeServices = opsRes.value.services
                        activeDeliveries = opsRes.value.deliveries
                    }
                }
            }
        }
    }

    val canvasColor = Color(0xFF0B1120)
    val surfaceColor = Color(0xFF0F172A)

    Scaffold(
        containerColor = canvasColor,
        topBar = {
            // MobileTopBar Header (Matching resident-pwa)
            TopAppBar(
                title = {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                    ) {
                        Text(
                            text = "DOMMIA",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Black),
                            color = Color.White,
                        )
                        Text(
                            text = "Resident",
                            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                            color = Color(0xFF60A5FA),
                        )
                    }
                },
                actions = {
                    // Connectivity Badge
                    Box(
                        modifier = Modifier
                            .background(Color(0x2610B981), shape = RoundedCornerShape(20.dp))
                            .border(1.dp, Color(0x4010B981), shape = RoundedCornerShape(20.dp))
                            .padding(horizontal = 10.dp, vertical = 4.dp),
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(6.dp)
                                    .background(Color(0xFF34D399), shape = CircleShape),
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "En línea",
                                style = MaterialTheme.typography.labelSmall.copy(fontSize = 10.sp, fontWeight = FontWeight.Bold),
                                color = Color(0xFFA7F3D0),
                            )
                        }
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    TextButton(onClick = { sessionManager.clearSession() }) {
                        Text(
                            text = "Salir",
                            style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                            color = Color(0xFF94A3B8),
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = surfaceColor.copy(alpha = 0.95f),
                ),
            )
        },
        bottomBar = {
            // MobileTabBar Navigation (Matching resident-pwa bottom bar)
            NavigationBar(
                containerColor = surfaceColor.copy(alpha = 0.98f),
                tonalElevation = 0.dp,
                modifier = Modifier.border(width = (0.5).dp, color = Color(0xFF1E293B)),
            ) {
                NavigationBarItem(
                    selected = activeTab == TabKey.CREDENTIAL,
                    onClick = { activeTab = TabKey.CREDENTIAL },
                    icon = { Icon(Icons.Filled.Lock, contentDescription = "Mi Credencial") },
                    label = { Text("Mi Credencial", fontSize = 10.sp) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Color(0xFF60A5FA),
                        selectedTextColor = Color(0xFF60A5FA),
                        indicatorColor = Color(0x263B82F6),
                        unselectedIconColor = Color(0xFF94A3B8),
                        unselectedTextColor = Color(0xFF94A3B8),
                    ),
                )
                NavigationBarItem(
                    selected = activeTab == TabKey.PASSES,
                    onClick = { activeTab = TabKey.PASSES },
                    icon = { Icon(Icons.Filled.Add, contentDescription = "Pases Visita") },
                    label = { Text("Pases Visita", fontSize = 10.sp) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Color(0xFF60A5FA),
                        selectedTextColor = Color(0xFF60A5FA),
                        indicatorColor = Color(0x263B82F6),
                        unselectedIconColor = Color(0xFF94A3B8),
                        unselectedTextColor = Color(0xFF94A3B8),
                    ),
                )
                NavigationBarItem(
                    selected = activeTab == TabKey.NOTICES,
                    onClick = { activeTab = TabKey.NOTICES },
                    icon = { Icon(Icons.Filled.Notifications, contentDescription = "Circulares") },
                    label = { Text("Circulares", fontSize = 10.sp) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Color(0xFF60A5FA),
                        selectedTextColor = Color(0xFF60A5FA),
                        indicatorColor = Color(0x263B82F6),
                        unselectedIconColor = Color(0xFF94A3B8),
                        unselectedTextColor = Color(0xFF94A3B8),
                    ),
                )
                NavigationBarItem(
                    selected = activeTab == TabKey.FINANCE,
                    onClick = { activeTab = TabKey.FINANCE },
                    icon = { Icon(Icons.Filled.Home, contentDescription = "Mis Cuotas") },
                    label = { Text("Mis Cuotas", fontSize = 10.sp) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Color(0xFF60A5FA),
                        selectedTextColor = Color(0xFF60A5FA),
                        indicatorColor = Color(0x263B82F6),
                        unselectedIconColor = Color(0xFF94A3B8),
                        unselectedTextColor = Color(0xFF94A3B8),
                    ),
                )
            }
        },
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(rememberScrollState()),
        ) {
            Spacer(modifier = Modifier.height(16.dp))

            // Real-time Active Deliveries Alert (Package in Caseta)
            activeDeliveries.filter { !dismissedDeliveries.contains(it.id) }.forEach { delivery ->
                PackageAlertBanner(
                    delivery = delivery,
                    onDismiss = { dismissedDeliveries = dismissedDeliveries + delivery.id },
                )
                Spacer(modifier = Modifier.height(12.dp))
            }

            // Real-time Active Services Alert (Gas, Food, Water, Courier)
            activeServices.filter { !dismissedServices.contains(it.id) }.forEach { service ->
                ServiceAlertBanner(
                    service = service,
                    onDismiss = { dismissedServices = dismissedServices + service.id },
                )
                Spacer(modifier = Modifier.height(12.dp))
            }

            // Render Active Tab Content
            when (activeTab) {
                TabKey.CREDENTIAL -> {
                    // Resident Credential Digital Card (Matching ResidentCard in PWA)
                    ResidentCardComposable(
                        resident = resident,
                        tenantSlug = tenantSlug,
                        credential = credential,
                        financialStatus = financialStatus,
                        onOpenQR = { showQRModal = true },
                        onOpenFinance = { activeTab = TabKey.FINANCE },
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    // Quick Financial Shortcut Card
                    FinanceShortcutCard(
                        financialStatus = financialStatus,
                        onClick = { activeTab = TabKey.FINANCE },
                    )

                    Spacer(modifier = Modifier.height(20.dp))

                    // Recent Visitor Passes
                    PassesSummarySection(
                        passes = passes,
                        onOpenNewPass = { showQuickInviteModal = true },
                        onSharePass = { selectedPassForShare = it },
                    )
                }

                TabKey.PASSES -> {
                    PassesTabContent(
                        passes = passes,
                        onOpenNewPass = { showQuickInviteModal = true },
                        onSharePass = { selectedPassForShare = it },
                        onRevokePass = { passId ->
                            if (contentRepository != null) {
                                scope.launch {
                                    contentRepository.revokeVisitorPass(passId)
                                    val res = contentRepository.getVisitorPasses()
                                    if (res is ApiResult.Success) passes = res.value
                                }
                            }
                        },
                    )
                }

                TabKey.NOTICES -> {
                    NoticesTabContent(
                        notices = notices,
                        onRefresh = {
                            if (contentRepository != null) {
                                scope.launch {
                                    val res = contentRepository.getNotices()
                                    if (res is ApiResult.Success) notices = res.value
                                }
                            }
                        },
                    )
                }

                TabKey.FINANCE -> {
                    FinanceTabContent(
                        financialStatus = financialStatus,
                        campaigns = campaigns,
                        onOpenSpeiModal = { showSpeiModal = true },
                        onRefresh = {
                            if (financeRepository != null) {
                                scope.launch {
                                    val resStatus = financeRepository.getStatus()
                                    if (resStatus is ApiResult.Success) financialStatus = resStatus.value
                                    val resCamps = financeRepository.getCampaigns()
                                    if (resCamps is ApiResult.Success) campaigns = resCamps.value
                                }
                            }
                        },
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))
        }
    }

    // Modal 1: Dynamic QR Code Fullscreen / Large Dialog
    if (showQRModal) {
        DynamicQRModalDialog(
            credential = credential,
            resident = resident,
            tenantSlug = tenantSlug,
            onClose = { showQRModal = false },
        )
    }

    // Modal 2: Quick Visitor Pass Creation Dialog
    if (showQuickInviteModal) {
        QuickInviteModalDialog(
            onClose = { showQuickInviteModal = false },
            onCreate = { visitorName, passType, validDays, notes ->
                if (contentRepository != null) {
                    scope.launch {
                        val res = contentRepository.createVisitorPass(
                            CreateVisitorPassRequest(visitorName, passType, validDays, notes),
                        )
                        if (res is ApiResult.Success) {
                            Toast.makeText(context, "Pase creado para $visitorName", Toast.LENGTH_SHORT).show()
                            val passesRes = contentRepository.getVisitorPasses()
                            if (passesRes is ApiResult.Success) passes = passesRes.value
                            showQuickInviteModal = false
                        } else if (res is ApiResult.Error) {
                            Toast.makeText(context, res.message, Toast.LENGTH_LONG).show()
                        }
                    }
                }
            },
        )
    }

    // Modal 3: Share Pass Details Dialog
    selectedPassForShare?.let { pass ->
        SharePassModalDialog(
            pass = pass,
            resident = resident,
            tenantSlug = tenantSlug,
            onClose = { selectedPassForShare = null },
        )
    }

    // Modal 4: SPEI Details Modal Dialog
    if (showSpeiModal) {
        SpeiDetailsModalDialog(
            financialStatus = financialStatus,
            resident = resident,
            tenantSlug = tenantSlug,
            onClose = { showSpeiModal = false },
        )
    }
}

// ==============================================================================
// 1. RESIDENT DIGITAL CREDENTIAL CARD (COMPOSABLE)
// ==============================================================================
@Composable
private fun ResidentCardComposable(
    resident: ResidentProfile?,
    tenantSlug: String,
    credential: AccessCredential?,
    financialStatus: FinancialStatus?,
    onOpenQR: () -> Unit,
    onOpenFinance: () -> Unit,
) {
    val context = LocalContext.current
    val isUpToDate = financialStatus?.accountStatus == "UP_TO_DATE" || financialStatus?.accountStatus == "CREDIT_BALANCE"
    val communityName = resident?.let { "${it.firstName} ${it.lastName}" } ?: "Ana Rivera"
    val propertyAddress = resident?.let {
        listOfNotNull(
            it.street?.takeIf(String::isNotBlank),
            it.exteriorNumber?.takeIf(String::isNotBlank)?.let { num -> "#$num" },
            it.interiorNumber?.takeIf(String::isNotBlank)?.let { num -> "int. $num" },
        ).joinToString(" ").ifBlank { null }
    } ?: "Circuito del Roble #101"

    val cardGradient = Brush.linearGradient(
        colors = listOf(Color(0xFF1E293B), Color(0xFF0F172A), Color(0xFF020617)),
    )

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
        shape = RoundedCornerShape(28.dp),
        colors = CardDefaults.cardColors(containerColor = Color.Transparent),
        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF334155)),
    ) {
        Box(
            modifier = Modifier
                .background(cardGradient)
                .padding(20.dp),
        ) {
            Column {
                // Header: Credencial Digital + IDTENANT + Status Pill
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column {
                        Text(
                            text = "CREDENCIAL DIGITAL",
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Black,
                                letterSpacing = 1.5.sp,
                            ),
                            color = Color(0xFF60A5FA),
                        )
                        Text(
                            text = "Fracc. ${tenantSlug.replace("_", " ").uppercase()}",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Black),
                            color = Color.White,
                        )

                        // IDTENANT Copy Pill
                        Spacer(modifier = Modifier.height(4.dp))
                        Box(
                            modifier = Modifier
                                .background(Color(0xFF0F172A), shape = RoundedCornerShape(8.dp))
                                .border(1.dp, Color(0xFF334155), shape = RoundedCornerShape(8.dp))
                                .clickable {
                                    val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                                    clipboard.setPrimaryClip(ClipData.newPlainText("IDTENANT", tenantSlug))
                                    Toast
                                        .makeText(context, "IDTENANT $tenantSlug copiado", Toast.LENGTH_SHORT)
                                        .show()
                                }
                                .padding(horizontal = 8.dp, vertical = 3.dp),
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = "IDTENANT ",
                                    style = MaterialTheme.typography.labelSmall.copy(fontSize = 10.sp, fontWeight = FontWeight.Bold),
                                    color = Color(0xFF94A3B8),
                                )
                                Text(
                                    text = tenantSlug,
                                    style = MaterialTheme.typography.labelSmall.copy(fontSize = 10.sp, fontWeight = FontWeight.Bold),
                                    color = Color(0xFF93C5FD),
                                )
                            }
                        }
                    }

                    // Payment Status Pill
                    Box(
                        modifier = Modifier
                            .background(
                                color = if (isUpToDate) Color(0x2610B981) else Color(0x26EF4444),
                                shape = RoundedCornerShape(20.dp),
                            )
                            .border(
                                width = 1.dp,
                                color = if (isUpToDate) Color(0x6610B981) else Color(0x66EF4444),
                                shape = RoundedCornerShape(20.dp),
                            )
                            .clickable { onOpenFinance() }
                            .padding(horizontal = 10.dp, vertical = 5.dp),
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = if (isUpToDate) Icons.Filled.CheckCircle else Icons.Filled.Warning,
                                contentDescription = null,
                                tint = if (isUpToDate) Color(0xFF34D399) else Color(0xFFF87171),
                                modifier = Modifier.size(12.dp),
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = if (isUpToDate) "Al Corriente ›" else "Cuota Pendiente ›",
                                style = MaterialTheme.typography.labelSmall.copy(fontSize = 10.sp, fontWeight = FontWeight.Black),
                                color = if (isUpToDate) Color(0xFFA7F3D0) else Color(0xFFFECACA),
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(18.dp))

                // Resident Body Info + Dynamic QR Button
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "COLONO ACREDITADO",
                            style = MaterialTheme.typography.labelSmall.copy(fontSize = 10.sp, fontWeight = FontWeight.Bold),
                            color = Color(0xFF94A3B8),
                        )
                        Text(
                            text = communityName,
                            style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Black),
                            color = Color.White,
                        )

                        Spacer(modifier = Modifier.height(6.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Filled.Home,
                                contentDescription = null,
                                tint = Color(0xFF60A5FA),
                                modifier = Modifier.size(14.dp),
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = propertyAddress,
                                style = MaterialTheme.typography.bodySmall,
                                color = Color(0xFFCBD5E1),
                            )
                        }

                        Spacer(modifier = Modifier.height(8.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Box(
                                modifier = Modifier
                                    .background(Color(0xFF1E293B), shape = RoundedCornerShape(6.dp))
                                    .border(1.dp, Color(0xFF334155), shape = RoundedCornerShape(6.dp))
                                    .padding(horizontal = 6.dp, vertical = 2.dp),
                            ) {
                                Text(
                                    text = if (resident?.role == "OWNER") "Propietario" else "Residente",
                                    style = MaterialTheme.typography.labelSmall.copy(fontSize = 10.sp, fontWeight = FontWeight.Bold),
                                    color = Color(0xFFCBD5E1),
                                )
                            }
                            if (resident?.isPrimary == true) {
                                Box(
                                    modifier = Modifier
                                        .background(Color(0x263B82F6), shape = RoundedCornerShape(6.dp))
                                        .padding(horizontal = 6.dp, vertical = 2.dp),
                                ) {
                                    Text(
                                        text = "Titular",
                                        style = MaterialTheme.typography.labelSmall.copy(fontSize = 10.sp, fontWeight = FontWeight.Bold),
                                        color = Color(0xFF93C5FD),
                                    )
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.width(12.dp))

                    // Dynamic QR Button Box
                    Box(
                        modifier = Modifier
                            .background(Color(0x263B82F6), shape = RoundedCornerShape(20.dp))
                            .border(1.dp, Color(0x663B82F6), shape = RoundedCornerShape(20.dp))
                            .clickable { onOpenQR() }
                            .padding(horizontal = 16.dp, vertical = 14.dp),
                        contentAlignment = Alignment.Center,
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(
                                imageVector = Icons.Filled.Lock,
                                contentDescription = "Ver QR",
                                tint = Color.White,
                                modifier = Modifier.size(32.dp),
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = credential?.code ?: "839 201",
                                style = MaterialTheme.typography.labelMedium.copy(
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 11.sp,
                                ),
                                color = Color(0xFFBFDBFE),
                            )
                            Text(
                                text = "VER QR",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Black,
                                ),
                                color = Color(0xFF60A5FA),
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Card Footer
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color(0x400F172A), shape = RoundedCornerShape(12.dp))
                        .padding(horizontal = 12.dp, vertical = 8.dp),
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(
                            text = "ID: ${resident?.id?.take(12) ?: "cur_res_01"}...",
                            style = MaterialTheme.typography.bodySmall.copy(fontSize = 10.sp),
                            color = Color(0xFF64748B),
                        )
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(6.dp)
                                    .background(Color(0xFF34D399), shape = CircleShape),
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "Credencial QR habilitada",
                                style = MaterialTheme.typography.labelSmall.copy(fontSize = 10.sp, fontWeight = FontWeight.Bold),
                                color = Color(0xFF34D399),
                            )
                        }
                    }
                }
            }
        }
    }
}

// ==============================================================================
// 2. REAL-TIME BANNERS (DELIVERY & SERVICE)
// ==============================================================================
@Composable
private fun PackageAlertBanner(
    delivery: ActiveDelivery,
    onDismiss: () -> Unit,
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF1E1B4B)),
        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF6366F1)),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.weight(1f),
            ) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .background(Color(0x336366F1), shape = RoundedCornerShape(12.dp)),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(
                        imageVector = Icons.Filled.Info,
                        contentDescription = null,
                        tint = Color(0xFFA5B4FC),
                        modifier = Modifier.size(20.dp),
                    )
                }
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text(
                        text = "PAQUETE EN CASETA",
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Black,
                        ),
                        color = Color(0xFFC7D2FE),
                    )
                    Text(
                        text = "${delivery.carrier} • Para: ${delivery.recipientName}",
                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                        color = Color.White,
                    )
                    Text(
                        text = "Paquete en resguardo listo para su retiro.",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color(0xFF94A3B8),
                    )
                }
            }
            Spacer(modifier = Modifier.width(8.dp))
            Button(
                onClick = onDismiss,
                shape = RoundedCornerShape(10.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0x3310B981), contentColor = Color(0xFF6EE7B7)),
            ) {
                Text("Enterado", style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold))
            }
        }
    }
}

@Composable
private fun ServiceAlertBanner(
    service: ActiveService,
    onDismiss: () -> Unit,
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF451A03)),
        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFF59E0B)),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.weight(1f),
            ) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .background(Color(0x33F59E0B), shape = RoundedCornerShape(12.dp)),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(
                        imageVector = Icons.Filled.Info,
                        contentDescription = null,
                        tint = Color(0xFFFDE68A),
                        modifier = Modifier.size(20.dp),
                    )
                }
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text(
                        text = "SERVICIO EN CAMINO",
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Black,
                        ),
                        color = Color(0xFFFDE68A),
                    )
                    Text(
                        text = service.supplierName ?: service.customServiceName ?: "Proveedor autorizado",
                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                        color = Color.White,
                    )
                    Text(
                        text = "Ingreso registrado en caseta. Se dirige a tu propiedad.",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color(0xFFCBD5E1),
                    )
                }
            }
            Spacer(modifier = Modifier.width(8.dp))
            Button(
                onClick = onDismiss,
                shape = RoundedCornerShape(10.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0x3310B981), contentColor = Color(0xFF6EE7B7)),
            ) {
                Text("Enterado", style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold))
            }
        }
    }
}

// ==============================================================================
// 3. FINANCIAL SHORTCUT CARD
// ==============================================================================
@Composable
private fun FinanceShortcutCard(
    financialStatus: FinancialStatus?,
    onClick: () -> Unit,
) {
    val isUpToDate = financialStatus?.accountStatus == "UP_TO_DATE" || financialStatus?.accountStatus == "CREDIT_BALANCE"

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp)
            .clickable { onClick() },
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF1E293B)),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(38.dp)
                        .background(
                            color = if (isUpToDate) Color(0x2610B981) else Color(0x26EF4444),
                            shape = RoundedCornerShape(12.dp),
                        ),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(
                        imageVector = Icons.Filled.Home,
                        contentDescription = null,
                        tint = if (isUpToDate) Color(0xFF34D399) else Color(0xFFF87171),
                        modifier = Modifier.size(20.dp),
                    )
                }
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text(
                        text = "Mis Cuotas & Estado de Cuenta",
                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                        color = Color.White,
                    )
                    Text(
                        text = if (isUpToDate) "✓ Al corriente • Ver recibos y SPEI" else "⚠ Cuota pendiente • Pagar aquí",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color(0xFF94A3B8),
                    )
                }
            }
            Icon(
                imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                contentDescription = null,
                tint = Color(0xFF64748B),
                modifier = Modifier.size(18.dp),
            )
        }
    }
}

// ==============================================================================
// 4. VISITOR PASSES SUMMARY SECTION (TAB 1 & TAB 2)
// ==============================================================================
@Composable
private fun PassesSummarySection(
    passes: List<VisitorPass>,
    onOpenNewPass: () -> Unit,
    onSharePass: (VisitorPass) -> Unit,
) {
    Column(modifier = Modifier.padding(horizontal = 16.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column {
                Text(
                    text = "PASES DE VISITAS",
                    style = MaterialTheme.typography.labelSmall.copy(
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Black,
                        letterSpacing = 1.sp,
                    ),
                    color = Color(0xFFCBD5E1),
                )
                Text(
                    text = "${passes.count { it.status == "ACTIVE" }} activo(s)",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color(0xFF94A3B8),
                )
            }

            Button(
                onClick = onOpenNewPass,
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2563EB), contentColor = Color.White),
            ) {
                Icon(Icons.Filled.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("Nuevo Pase", style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold))
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        if (passes.none { it.status == "ACTIVE" }) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF1E293B)),
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Icon(Icons.Filled.Add, contentDescription = null, tint = Color(0xFF475569), modifier = Modifier.size(32.dp))
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "No tienes pases de visita vigentes",
                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                        color = Color(0xFF94A3B8),
                    )
                    Text(
                        text = "Genera un nuevo pase para autorizar el acceso de tus visitantes.",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color(0xFF64748B),
                        textAlign = TextAlign.Center,
                    )
                }
            }
        } else {
            passes.filter { it.status == "ACTIVE" }.take(2).forEach { pass ->
                VisitorPassCardRow(
                    pass = pass,
                    onShare = { onSharePass(pass) },
                    onRevoke = {},
                )
                Spacer(modifier = Modifier.height(8.dp))
            }
        }
    }
}

@Composable
private fun PassesTabContent(
    passes: List<VisitorPass>,
    onOpenNewPass: () -> Unit,
    onSharePass: (VisitorPass) -> Unit,
    onRevokePass: (String) -> Unit,
) {
    var activeFilter by remember { mutableStateOf("ACTIVE") }

    val filteredPasses = when (activeFilter) {
        "ACTIVE" -> passes.filter { it.status == "ACTIVE" }
        "HISTORY" -> passes.filter { it.status != "ACTIVE" }
        else -> passes
    }

    Column(modifier = Modifier.padding(horizontal = 16.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column {
                Text(
                    text = "Pases de Visitas",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Black),
                    color = Color.White,
                )
                Text(
                    text = "${passes.count { it.status == "ACTIVE" }} activo(s) · ${passes.count { it.status != "ACTIVE" }} en historial",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color(0xFF94A3B8),
                )
            }

            Button(
                onClick = onOpenNewPass,
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2563EB), contentColor = Color.White),
            ) {
                Icon(Icons.Filled.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("Nuevo Pase", style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold))
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Filter Tabs
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color(0xFF0F172A), shape = RoundedCornerShape(14.dp))
                .border(1.dp, Color(0xFF1E293B), shape = RoundedCornerShape(14.dp))
                .padding(4.dp),
            horizontalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            Box(
                modifier = Modifier
                    .weight(1f)
                    .background(
                        color = if (activeFilter == "ACTIVE") Color(0xFF2563EB) else Color.Transparent,
                        shape = RoundedCornerShape(10.dp),
                    )
                    .clickable { activeFilter = "ACTIVE" }
                    .padding(vertical = 8.dp),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text = "Vigentes (${passes.count { it.status == "ACTIVE" }})",
                    style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                    color = if (activeFilter == "ACTIVE") Color.White else Color(0xFF94A3B8),
                )
            }

            Box(
                modifier = Modifier
                    .weight(1f)
                    .background(
                        color = if (activeFilter == "HISTORY") Color(0xFF2563EB) else Color.Transparent,
                        shape = RoundedCornerShape(10.dp),
                    )
                    .clickable { activeFilter = "HISTORY" }
                    .padding(vertical = 8.dp),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text = "Historial (${passes.count { it.status != "ACTIVE" }})",
                    style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                    color = if (activeFilter == "HISTORY") Color.White else Color(0xFF94A3B8),
                )
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        if (filteredPasses.isEmpty()) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF1E293B)),
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Icon(Icons.Filled.Add, contentDescription = null, tint = Color(0xFF475569), modifier = Modifier.size(36.dp))
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = if (activeFilter == "ACTIVE") "No tienes pases vigentes" else "No hay historial de pases",
                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                        color = Color(0xFF94A3B8),
                    )
                }
            }
        } else {
            filteredPasses.forEach { pass ->
                VisitorPassCardRow(
                    pass = pass,
                    onShare = { onSharePass(pass) },
                    onRevoke = { onRevokePass(pass.id) },
                )
                Spacer(modifier = Modifier.height(8.dp))
            }
        }
    }
}

@Composable
private fun VisitorPassCardRow(
    pass: VisitorPass,
    onShare: () -> Unit,
    onRevoke: () -> Unit,
) {
    val isActive = pass.status == "ACTIVE"

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF1E293B)),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = pass.visitorName,
                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                        color = Color.White,
                    )
                    Spacer(modifier = Modifier.width(8.dp))

                    // Status Badge
                    Box(
                        modifier = Modifier
                            .background(
                                color = if (isActive) Color(0x2610B981) else Color(0x2694A3B8),
                                shape = RoundedCornerShape(6.dp),
                            )
                            .padding(horizontal = 6.dp, vertical = 2.dp),
                    ) {
                        Text(
                            text = if (isActive) "Vigente" else pass.status,
                            style = MaterialTheme.typography.labelSmall.copy(fontSize = 9.sp, fontWeight = FontWeight.Bold),
                            color = if (isActive) Color(0xFF34D399) else Color(0xFF94A3B8),
                        )
                    }
                }

                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Vence: ${pass.validUntil?.take(10) ?: "En 24h"}",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color(0xFF94A3B8),
                )
                pass.notes?.let {
                    Text(text = "Nota: $it", style = MaterialTheme.typography.bodySmall, color = Color(0xFF64748B))
                }
            }

            Row {
                IconButton(onClick = onShare) {
                    Icon(Icons.Filled.Share, contentDescription = "Compartir", tint = Color(0xFF34D399))
                }
                if (isActive) {
                    IconButton(onClick = onRevoke) {
                        Icon(Icons.Filled.Close, contentDescription = "Revocar", tint = Color(0xFFF87171))
                    }
                }
            }
        }
    }
}

// ==============================================================================
// 5. NOTICES TAB CONTENT (TAB 3)
// ==============================================================================
@Composable
private fun NoticesTabContent(
    notices: List<ResidentNotice>,
    onRefresh: () -> Unit,
) {
    Column(modifier = Modifier.padding(horizontal = 16.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column {
                Text(
                    text = "Circulares y Avisos",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Black),
                    color = Color.White,
                )
                Text(
                    text = "${notices.size} publicado(s)",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color(0xFF94A3B8),
                )
            }
            TextButton(onClick = onRefresh) {
                Text("Actualizar", color = Color(0xFF60A5FA))
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        if (notices.isEmpty()) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF1E293B)),
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Icon(Icons.Filled.Notifications, contentDescription = null, tint = Color(0xFF475569), modifier = Modifier.size(36.dp))
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "No hay avisos recientes",
                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                        color = Color(0xFF94A3B8),
                    )
                }
            }
        } else {
            notices.forEach { notice ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF1E293B)),
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .background(Color(0x263B82F6), shape = RoundedCornerShape(6.dp))
                                    .padding(horizontal = 6.dp, vertical = 2.dp),
                            ) {
                                Text(
                                    text = notice.category ?: "Comunidad",
                                    style = MaterialTheme.typography.labelSmall.copy(fontSize = 10.sp, fontWeight = FontWeight.Bold),
                                    color = Color(0xFF93C5FD),
                                )
                            }
                            if (notice.isPinned) {
                                Spacer(modifier = Modifier.width(6.dp))
                                Box(
                                    modifier = Modifier
                                        .background(Color(0x26F59E0B), shape = RoundedCornerShape(6.dp))
                                        .padding(horizontal = 6.dp, vertical = 2.dp),
                                ) {
                                    Text(
                                        text = "Fijado",
                                        style = MaterialTheme.typography.labelSmall.copy(fontSize = 10.sp, fontWeight = FontWeight.Bold),
                                        color = Color(0xFFFDE68A),
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        Text(
                            text = notice.title,
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            color = Color.White,
                        )

                        Spacer(modifier = Modifier.height(6.dp))

                        Text(
                            text = notice.content,
                            style = MaterialTheme.typography.bodyMedium,
                            color = Color(0xFFCBD5E1),
                        )

                        notice.authorName?.let {
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "Publicado por $it",
                                style = MaterialTheme.typography.bodySmall,
                                color = Color(0xFF64748B),
                            )
                        }
                    }
                }
                Spacer(modifier = Modifier.height(10.dp))
            }
        }
    }
}

// ==============================================================================
// 6. FINANCE TAB CONTENT (TAB 4)
// ==============================================================================
@Composable
private fun FinanceTabContent(
    financialStatus: FinancialStatus?,
    campaigns: List<AnnualCampaign>,
    onOpenSpeiModal: () -> Unit,
    onRefresh: () -> Unit,
) {
    val isUpToDate = financialStatus?.accountStatus == "UP_TO_DATE" || financialStatus?.accountStatus == "CREDIT_BALANCE"

    Column(modifier = Modifier.padding(horizontal = 16.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column {
                Text(
                    text = "Mis Cuotas & Estado de Cuenta",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Black),
                    color = Color.White,
                )
                Text(
                    text = if (isUpToDate) "✓ Al corriente con tu comunidad" else "⚠ Cuotas pendientes de pago",
                    style = MaterialTheme.typography.bodySmall,
                    color = if (isUpToDate) Color(0xFF34D399) else Color(0xFFF87171),
                )
            }
            TextButton(onClick = onRefresh) {
                Text("Actualizar", color = Color(0xFF60A5FA))
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Balance Summary Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF1E293B)),
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Text(
                    text = "SALDO ACTUAL",
                    style = MaterialTheme.typography.labelSmall.copy(fontSize = 10.sp, fontWeight = FontWeight.Bold),
                    color = Color(0xFF94A3B8),
                )
                Text(
                    text = NumberFormat.getCurrencyInstance(Locale("es", "MX")).format(financialStatus?.totalBalanceDue ?: 0.0),
                    style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Black),
                    color = if (isUpToDate) Color(0xFF34D399) else Color(0xFFF87171),
                )

                Spacer(modifier = Modifier.height(14.dp))

                Button(
                    onClick = onOpenSpeiModal,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2563EB), contentColor = Color.White),
                ) {
                    Text("Ver Datos de Transferencia SPEI", style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold))
                }
            }
        }
    }
}

// ==============================================================================
// 7. MODALS & DIALOGS (QR, QUICK PASS, SHARE PASS, SPEI)
// ==============================================================================
@Composable
private fun DynamicQRModalDialog(
    credential: AccessCredential?,
    resident: ResidentProfile?,
    tenantSlug: String,
    onClose: () -> Unit,
) {
    val qrBitmap = remember(credential?.payload) {
        encodeQr(credential?.payload ?: "DOMMIA_QR_SAMPLE")
    }

    Dialog(onDismissRequest = onClose) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(28.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF1E293B)),
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text("Credencial Digital QR", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold), color = Color.White)
                    IconButton(onClick = onClose) {
                        Icon(Icons.Filled.Close, contentDescription = "Cerrar", tint = Color(0xFF94A3B8))
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // QR Code Image
                Image(
                    bitmap = qrBitmap.asImageBitmap(),
                    contentDescription = "Código QR de Acceso",
                    modifier = Modifier.size(220.dp),
                )

                Spacer(modifier = Modifier.height(12.dp))

                Text(
                    text = credential?.code ?: "839 201",
                    style = MaterialTheme.typography.headlineLarge.copy(fontWeight = FontWeight.Black),
                    color = Color(0xFF60A5FA),
                )

                Spacer(modifier = Modifier.height(6.dp))

                Text(
                    text = "El código se regenera automáticamente cada 30 segundos.",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color(0xFF94A3B8),
                    textAlign = TextAlign.Center,
                )

                Spacer(modifier = Modifier.height(16.dp))

                Button(
                    onClick = onClose,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF334155), contentColor = Color.White),
                ) {
                    Text("Cerrar")
                }
            }
        }
    }
}

@Composable
private fun QuickInviteModalDialog(
    onClose: () -> Unit,
    onCreate: (visitorName: String, passType: String, validDays: Int, notes: String?) -> Unit,
) {
    var visitorName by remember { mutableStateOf("") }
    var passType by remember { mutableStateOf("SINGLE_USE") }
    var validDays by remember { mutableStateOf("1") }
    var notes by remember { mutableStateOf("") }

    Dialog(onDismissRequest = onClose) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(28.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF1E293B)),
        ) {
            Column(modifier = Modifier.padding(24.dp)) {
                Text("Nuevo Pase de Visita", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold), color = Color.White)
                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = visitorName,
                    onValueChange = { visitorName = it },
                    label = { Text("Nombre del visitante") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                )

                Spacer(modifier = Modifier.height(10.dp))

                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    label = { Text("Notas opcionales") },
                    modifier = Modifier.fillMaxWidth(),
                )

                Spacer(modifier = Modifier.height(16.dp))

                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    Button(
                        onClick = onClose,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF334155)),
                    ) { Text("Cancelar") }

                    Button(
                        onClick = {
                            if (visitorName.isNotBlank()) {
                                onCreate(visitorName.trim(), passType, validDays.toIntOrNull() ?: 1, notes.trim().ifBlank { null })
                            }
                        },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2563EB)),
                    ) { Text("Generar Pase") }
                }
            }
        }
    }
}

@Composable
private fun SharePassModalDialog(
    pass: VisitorPass,
    resident: ResidentProfile?,
    tenantSlug: String,
    onClose: () -> Unit,
) {
    val context = LocalContext.current
    val qrBitmap = remember(pass.id) { encodeQr(pass.id) }

    Dialog(onDismissRequest = onClose) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(28.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF1E293B)),
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Text("Pase de Acceso para Visita", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold), color = Color.White)
                Spacer(modifier = Modifier.height(12.dp))

                Image(bitmap = qrBitmap.asImageBitmap(), contentDescription = "Pase QR", modifier = Modifier.size(180.dp))

                Spacer(modifier = Modifier.height(12.dp))

                Text(pass.visitorName, style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold), color = Color.White)
                Text("Fracc. ${tenantSlug.uppercase()}", style = MaterialTheme.typography.bodySmall, color = Color(0xFF94A3B8))

                Spacer(modifier = Modifier.height(16.dp))

                Button(
                    onClick = {
                        val text = "Pase de acceso DOMMIA Resident para ${pass.visitorName}.\nFraccionamiento: $tenantSlug\nCódigo: ${pass.id}"
                        val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                        clipboard.setPrimaryClip(ClipData.newPlainText("Pase Visita", text))
                        Toast.makeText(context, "Pase copiado al portapapeles", Toast.LENGTH_SHORT).show()
                    },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981)),
                ) {
                    Text("Copiar Texto del Pase")
                }
            }
        }
    }
}

@Composable
private fun SpeiDetailsModalDialog(
    financialStatus: FinancialStatus?,
    resident: ResidentProfile?,
    tenantSlug: String,
    onClose: () -> Unit,
) {
    val context = LocalContext.current

    Dialog(onDismissRequest = onClose) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(28.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF1E293B)),
        ) {
            Column(modifier = Modifier.padding(24.dp)) {
                Text("Datos de Transferencia SPEI", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold), color = Color.White)
                Spacer(modifier = Modifier.height(12.dp))

                Text("Banco: BBVA México", style = MaterialTheme.typography.bodyMedium, color = Color.White)
                Text("CLABE: 012 180 0150 1234 5678 9", style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold), color = Color(0xFF60A5FA))
                Text("Beneficiario: DOMMIA $tenantSlug", style = MaterialTheme.typography.bodySmall, color = Color(0xFFCBD5E1))
                Text("Concepto/Referencia: ${resident?.propertyId ?: tenantSlug}", style = MaterialTheme.typography.bodySmall, color = Color(0xFFCBD5E1))

                Spacer(modifier = Modifier.height(16.dp))

                Button(
                    onClick = {
                        val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                        clipboard.setPrimaryClip(ClipData.newPlainText("CLABE SPEI", "0121800150123456789"))
                        Toast.makeText(context, "CLABE copiada al portapapeles", Toast.LENGTH_SHORT).show()
                    },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2563EB)),
                ) {
                    Text("Copiar CLABE")
                }

                Spacer(modifier = Modifier.height(8.dp))

                Button(
                    onClick = onClose,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF334155)),
                ) {
                    Text("Cerrar")
                }
            }
        }
    }
}

private fun encodeQr(payload: String): Bitmap {
    val matrix = MultiFormatWriter().encode(
        payload,
        BarcodeFormat.QR_CODE,
        512,
        512,
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
