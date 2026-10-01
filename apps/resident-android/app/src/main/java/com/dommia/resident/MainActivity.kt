package com.dommia.resident

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.lifecycleScope
import com.dommia.resident.core.network.ApiClient
import com.dommia.resident.core.network.AccessApi
import com.dommia.resident.core.network.ApiResult
import com.dommia.resident.core.network.AuthApi
import com.dommia.resident.core.network.ResidentContentApi
import com.dommia.resident.core.network.FinanceApi
import com.dommia.resident.core.session.AccessRepository
import com.dommia.resident.core.session.AuthRepository
import com.dommia.resident.core.session.AuthState
import com.dommia.resident.core.session.ResidentContentRepository
import com.dommia.resident.core.session.ResidentOperationsRepository
import com.dommia.resident.core.session.ResidentFinanceRepository
import com.dommia.resident.core.session.SessionManager
import com.dommia.resident.feature.auth.LoginScreen
import com.dommia.resident.feature.auth.ResidentActivationScreen
import com.dommia.resident.feature.auth.ResidentPasswordResetScreen
import com.dommia.resident.feature.home.ResidentHomeScreen
import com.dommia.resident.ui.theme.DommiaResidentTheme
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    private var pendingDeepLink by mutableStateOf<ResidentDeepLink?>(null)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        pendingDeepLink = parseResidentDeepLink(intent)

        val sessionManager = SessionManager(applicationContext)
        val authRepository = AuthRepository(
            authApi = ApiClient.create(sessionManager).create(AuthApi::class.java),
            sessionManager = sessionManager,
        )
        val accessRepository = AccessRepository(
            accessApi = ApiClient.create(sessionManager).create(AccessApi::class.java),
            sessionManager = sessionManager,
        )
        val operationsRepository = ResidentOperationsRepository(
            accessApi = ApiClient.create(sessionManager).create(AccessApi::class.java),
            sessionManager = sessionManager,
        )
        val financeRepository = ResidentFinanceRepository(
            financeApi = ApiClient.create(sessionManager).create(FinanceApi::class.java),
            sessionManager = sessionManager,
        )
        val contentRepository = ResidentContentRepository(
            api = ApiClient.create(sessionManager).create(ResidentContentApi::class.java),
            sessionManager = sessionManager,
        )

        lifecycleScope.launch {
            if (sessionManager.accessToken != null) {
                sessionManager.setLoading("Validando sesión...")
                when (val result = authRepository.me()) {
                    is ApiResult.Success -> Unit
                    is ApiResult.Error -> {
                        if (result.code == 401 || result.code == 403) {
                            sessionManager.expireSession()
                        } else {
                            sessionManager.clearSession()
                        }
                    }
                    is ApiResult.Loading -> Unit
                }
            }
        }

        setContent {
            DommiaResidentTheme {
                val authState by sessionManager.state.collectAsState()

                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background,
                ) {
                    when (val deepLink = pendingDeepLink) {
                        is ResidentDeepLink.Activation -> ResidentActivationScreen(
                            repository = authRepository,
                            activationToken = deepLink.token,
                            tenantSlug = deepLink.tenantSlug,
                            onCompleted = { pendingDeepLink = null },
                        )
                        is ResidentDeepLink.PasswordReset -> ResidentPasswordResetScreen(
                            repository = authRepository,
                            resetToken = deepLink.token,
                            onCompleted = { pendingDeepLink = null },
                        )
                        null -> {
                            val currentAuthState = authState
                            when (currentAuthState) {
                                is AuthState.Authenticated -> ResidentHomeScreen(
                                    sessionManager = sessionManager,
                                    authRepository = authRepository,
                                    accessRepository = accessRepository,
                                    contentRepository = contentRepository,
                                    operationsRepository = operationsRepository,
                                    financeRepository = financeRepository,
                                )
                                is AuthState.Expired -> LoginScreen(
                                    sessionManager = sessionManager,
                                    authRepository = authRepository,
                                    bannerMessage = "Tu sesión expiró. Vuelve a iniciar sesión.",
                                )
                                is AuthState.Loading -> LoginScreen(
                                    sessionManager = sessionManager,
                                    authRepository = authRepository,
                                    bannerMessage = currentAuthState.message.ifBlank { "Verificando sesión..." },
                                )
                                else -> LoginScreen(
                                    sessionManager = sessionManager,
                                    authRepository = authRepository,
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        pendingDeepLink = parseResidentDeepLink(intent)
    }
}

private sealed interface ResidentDeepLink {
    data class Activation(val token: String, val tenantSlug: String?) : ResidentDeepLink
    data class PasswordReset(val token: String) : ResidentDeepLink
}

private fun parseResidentDeepLink(intent: Intent?): ResidentDeepLink? {
    val data: Uri = intent?.data ?: return null
    val token = data.getQueryParameter("token")?.trim().orEmpty()
    if (token.isBlank()) return null

    return when (data.path?.trimEnd('/')) {
        "/activate-resident" -> ResidentDeepLink.Activation(
            token = token,
            tenantSlug = data.getQueryParameter("tenant")?.trim()?.ifBlank { null },
        )
        "/reset-resident" -> ResidentDeepLink.PasswordReset(token)
        else -> null
    }
}
