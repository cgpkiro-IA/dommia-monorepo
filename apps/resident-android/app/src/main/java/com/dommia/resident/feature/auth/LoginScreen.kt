package com.dommia.resident.feature.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.dommia.resident.core.network.ApiClient
import com.dommia.resident.core.network.AuthApi
import com.dommia.resident.core.session.AuthRepository
import com.dommia.resident.core.session.SessionManager

@Composable
fun LoginScreen(
    sessionManager: SessionManager = SessionManager(androidx.compose.ui.platform.LocalContext.current.applicationContext as android.content.Context),
    bannerMessage: String? = null,
    authRepository: AuthRepository? = null,
    viewModel: LoginViewModel = viewModel {
        val repository = authRepository ?: AuthRepository(
            authApi = ApiClient.create(sessionManager).create(AuthApi::class.java),
            sessionManager = sessionManager,
        )
        LoginViewModel(
            authRepository = repository,
            sessionManager = sessionManager,
        )
    },
) {
    val state by viewModel.uiState.collectAsState()
    val displayError = bannerMessage ?: state.error
    var showRecovery by remember { mutableStateOf(false) }

    if (state.requiresPasswordChange) {
        ResidentInitialPasswordScreen(
            identifier = state.identifier,
            tenantSlug = state.tenantSlug,
            isLoading = state.isLoading,
            error = state.error,
            onSubmit = viewModel::changeInitialPassword,
        )
        return
    }

    if (showRecovery) {
        val repository = remember(sessionManager, authRepository) {
            authRepository ?: AuthRepository(
                authApi = ApiClient.create(sessionManager).create(AuthApi::class.java),
                sessionManager = sessionManager,
            )
        }
        ResidentPasswordRecoveryScreen(
            repository = repository,
            initialIdentifier = state.identifier,
            initialTenantSlug = state.tenantSlug,
            onBack = { showRecovery = false },
        )
        return
    }

    val canvasColor = Color(0xFF08111F)
    val surfaceColor = Color(0xFF0F172A)
    val borderColor = Color(0xFF1E293B)
    val primaryBlue = Color(0xFF3B82F6)
    val inputBg = Color(0xFF020617)

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = canvasColor,
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 20.dp, vertical = 24.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            // App Branding Header (Matching ResidentAccessGate in PWA)
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 28.dp),
            ) {
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .background(Color(0x263B82F6), shape = RoundedCornerShape(14.dp)),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(
                        imageVector = Icons.Filled.Lock,
                        contentDescription = null,
                        tint = Color(0xFF93C5FD),
                        modifier = Modifier.size(24.dp),
                    )
                }
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text(
                        text = "DOMMIA RESIDENT",
                        style = MaterialTheme.typography.labelMedium.copy(
                            fontWeight = FontWeight.Black,
                            letterSpacing = 2.sp,
                        ),
                        color = Color(0xFF93C5FD),
                    )
                    Text(
                        text = "El acceso seguro de tu comunidad",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color(0xFF94A3B8),
                    )
                }
            }

            // Main Login Access Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = surfaceColor),
                shape = RoundedCornerShape(28.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, borderColor),
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp),
                ) {
                    Box(
                        modifier = Modifier
                            .size(48.dp)
                            .background(Color(0x2610B981), shape = RoundedCornerShape(16.dp)),
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(
                            imageVector = Icons.Filled.Lock,
                            contentDescription = null,
                            tint = Color(0xFF6EE7B7),
                            modifier = Modifier.size(24.dp),
                        )
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Text(
                        text = "Entra a tu comunidad",
                        style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Black),
                        color = Color.White,
                    )

                    Spacer(modifier = Modifier.height(6.dp))

                    Text(
                        text = "Consulta tus cuotas, invitaciones y avisos desde un solo lugar.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color(0xFF94A3B8),
                    )

                    Spacer(modifier = Modifier.height(24.dp))

                    // Field 1: Correo electrónico o celular
                    Text(
                        text = "Correo electrónico o celular",
                        style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                        color = Color(0xFFCBD5E1),
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    OutlinedTextField(
                        value = state.identifier,
                        onValueChange = viewModel::onIdentifierChange,
                        placeholder = { Text("correo@ejemplo.com o 55 1234 5678", color = Color(0xFF475569)) },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                        shape = RoundedCornerShape(14.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedContainerColor = inputBg,
                            unfocusedContainerColor = inputBg,
                            focusedBorderColor = primaryBlue,
                            unfocusedBorderColor = Color(0xFF334155),
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White,
                        ),
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    // Field 2: IDTENANT de tu comunidad
                    Text(
                        text = "IDTENANT de tu comunidad",
                        style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                        color = Color(0xFFCBD5E1),
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    OutlinedTextField(
                        value = state.tenantSlug,
                        onValueChange = viewModel::onTenantSlugChange,
                        placeholder = { Text("Ej. demo o guard-qa", color = Color(0xFF475569)) },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        shape = RoundedCornerShape(14.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedContainerColor = inputBg,
                            unfocusedContainerColor = inputBg,
                            focusedBorderColor = primaryBlue,
                            unfocusedBorderColor = Color(0xFF334155),
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White,
                        ),
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Es el código corto del fraccionamiento, por ejemplo demo.",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color(0xFF64748B),
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    // Field 3: Contraseña
                    Text(
                        text = "Contraseña",
                        style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                        color = Color(0xFFCBD5E1),
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    OutlinedTextField(
                        value = state.password,
                        onValueChange = viewModel::onPasswordChange,
                        placeholder = { Text("••••••••••••", color = Color(0xFF475569)) },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                        visualTransformation = PasswordVisualTransformation(),
                        shape = RoundedCornerShape(14.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedContainerColor = inputBg,
                            unfocusedContainerColor = inputBg,
                            focusedBorderColor = primaryBlue,
                            unfocusedBorderColor = Color(0xFF334155),
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White,
                        ),
                    )

                    // Unified Single Error Display
                    if (displayError != null) {
                        Spacer(modifier = Modifier.height(14.dp))
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(Color(0x26EF4444), shape = RoundedCornerShape(12.dp))
                                .border(1.dp, Color(0x66EF4444), shape = RoundedCornerShape(12.dp))
                                .padding(12.dp),
                        ) {
                            Text(
                                text = displayError,
                                style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Medium),
                                color = Color(0xFFFECACA),
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(20.dp))

                    // Primary Login Button
                    Button(
                        onClick = viewModel::login,
                        enabled = !state.isLoading,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(52.dp),
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = primaryBlue,
                            contentColor = Color.White,
                            disabledContainerColor = primaryBlue.copy(alpha = 0.5f),
                        ),
                    ) {
                        if (state.isLoading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(22.dp),
                                color = Color.White,
                                strokeWidth = 2.dp,
                            )
                        } else {
                            Text(
                                text = "Iniciar sesión",
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Black),
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    // Forgot Password Button
                    TextButton(
                        onClick = { showRecovery = true },
                        enabled = !state.isLoading,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text(
                            text = "Olvidé mi contraseña",
                            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                            color = Color(0xFF93C5FD),
                        )
                    }
                }
            }
        }
    }
}
