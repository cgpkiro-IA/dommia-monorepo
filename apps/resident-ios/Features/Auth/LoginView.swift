import SwiftUI

public struct LoginView: View {
    @Bindable var viewModel: LoginViewModel
    @State private var isPasswordVisible = false
    @State private var showRecoverySheet = false

    public init(viewModel: LoginViewModel) {
        self.viewModel = viewModel
    }

    public var body: some View {
        NavigationStack {
            ZStack {
                // Background Canvas (#08111F)
                DommiaTheme.canvas
                    .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 24) {
                        // Branding Header
                        brandingHeader
                            .padding(.top, 16)

                        // Main Login Card
                        VStack(alignment: .leading, spacing: 20) {
                            // Card Header: Lock badge + Title + Subtitle
                            cardHeader

                            // Form Fields
                            VStack(alignment: .leading, spacing: 16) {
                                // Field 1: Identifier
                                VStack(alignment: .leading, spacing: 6) {
                                    Text("Correo electrónico o celular")
                                        .font(.system(size: 13, weight: .bold))
                                        .foregroundStyle(DommiaTheme.textSecondary)

                                    TextField("", text: $viewModel.identifier, prompt: Text("correo@ejemplo.com o 55 1234 5678").foregroundColor(DommiaTheme.placeholder))
                                        .textInputAutocapitalization(.never)
                                        .autocorrectionDisabled()
                                        .keyboardType(.emailAddress)
                                        .dommiaTextField()
                                }

                                // Field 2: Tenant Slug
                                VStack(alignment: .leading, spacing: 6) {
                                    HStack {
                                        Text("Comunidad (Tenant)")
                                            .font(.system(size: 13, weight: .bold))
                                            .foregroundStyle(DommiaTheme.textSecondary)
                                        Spacer()
                                        Text("ej. demo")
                                            .font(.system(size: 11, weight: .medium))
                                            .foregroundStyle(DommiaTheme.textMuted)
                                    }

                                    TextField("", text: $viewModel.tenantSlug, prompt: Text("laspalmas o demo").foregroundColor(DommiaTheme.placeholder))
                                        .textInputAutocapitalization(.never)
                                        .autocorrectionDisabled()
                                        .dommiaTextField()

                                    Text("Código asignado por la administración de tu privada o fraccionamiento.")
                                        .font(.system(size: 11))
                                        .foregroundStyle(DommiaTheme.textMuted)
                                }

                                // Field 3: Password
                                VStack(alignment: .leading, spacing: 6) {
                                    Text("Contraseña")
                                        .font(.system(size: 13, weight: .bold))
                                        .foregroundStyle(DommiaTheme.textSecondary)

                                    HStack {
                                        if isPasswordVisible {
                                            TextField("", text: $viewModel.password, prompt: Text("••••••••••••").foregroundColor(DommiaTheme.placeholder))
                                                .textInputAutocapitalization(.never)
                                                .autocorrectionDisabled()
                                        } else {
                                            SecureField("", text: $viewModel.password, prompt: Text("••••••••••••").foregroundColor(DommiaTheme.placeholder))
                                                .textInputAutocapitalization(.never)
                                                .autocorrectionDisabled()
                                        }

                                        Button {
                                            isPasswordVisible.toggle()
                                        } label: {
                                            Image(systemName: isPasswordVisible ? "eye.slash.fill" : "eye.fill")
                                                .font(.system(size: 14))
                                                .foregroundStyle(DommiaTheme.textMuted)
                                        }
                                    }
                                    .dommiaTextField()
                                    .onSubmit {
                                        Task { await viewModel.login() }
                                    }
                                }

                                // Quick Demo Fill Helper
                                Button {
                                    viewModel.fillDemoCredentials()
                                } label: {
                                    HStack(spacing: 6) {
                                        Image(systemName: "sparkles")
                                            .font(.system(size: 12))
                                        Text("Rellenar credenciales Demo (Carlos Mendoza)")
                                            .font(.system(size: 12, weight: .medium))
                                    }
                                    .foregroundStyle(DommiaTheme.blueLight)
                                    .padding(.vertical, 6)
                                    .padding(.horizontal, 10)
                                    .background(DommiaTheme.blueBadge)
                                    .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                                }
                                .buttonStyle(.plain)
                            }

                            // Error Alert Banner
                            if let errorMessage = viewModel.errorMessage {
                                HStack(alignment: .top, spacing: 10) {
                                    Image(systemName: "exclamationmark.triangle.fill")
                                        .font(.system(size: 16))
                                        .foregroundStyle(DommiaTheme.danger)
                                        .padding(.top, 2)

                                    Text(errorMessage)
                                        .font(.system(size: 13, weight: .medium))
                                        .foregroundStyle(Color.white)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                                .padding(14)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .background(DommiaTheme.dangerDark)
                                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                                        .stroke(DommiaTheme.danger.opacity(0.6), lineWidth: 1)
                                )
                            }

                            // Success Alert Banner
                            if let successMessage = viewModel.successMessage {
                                HStack(alignment: .top, spacing: 10) {
                                    Image(systemName: "checkmark.circle.fill")
                                        .font(.system(size: 16))
                                        .foregroundStyle(DommiaTheme.emerald)
                                        .padding(.top, 2)

                                    Text(successMessage)
                                        .font(.system(size: 13, weight: .medium))
                                        .foregroundStyle(Color.white)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                                .padding(14)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .background(DommiaTheme.emeraldDark)
                                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                                        .stroke(DommiaTheme.emerald.opacity(0.6), lineWidth: 1)
                                )
                            }

                            // Submit Button
                            Button {
                                Task { await viewModel.login() }
                            } label: {
                                HStack(spacing: 8) {
                                    if viewModel.isLoading {
                                        ProgressView()
                                            .tint(.white)
                                    } else {
                                        Text("Entrar a mi comunidad")
                                            .font(.system(size: 16, weight: .bold))
                                        Image(systemName: "arrow.right")
                                            .font(.system(size: 14, weight: .bold))
                                    }
                                }
                                .frame(maxWidth: .infinity)
                                .frame(height: 52)
                                .background(DommiaTheme.primaryButtonGradient)
                                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                                .foregroundStyle(.white)
                                .shadow(color: DommiaTheme.primaryBlue.opacity(0.4), radius: 10, y: 4)
                            }
                            .keyboardShortcut(.defaultAction)
                            .disabled(viewModel.isLoading)

                            // Password Recovery Link
                            Button {
                                showRecoverySheet = true
                            } label: {
                                Text("¿Olvidaste tu contraseña o tienes problemas para entrar?")
                                    .font(.system(size: 13, weight: .medium))
                                    .foregroundStyle(DommiaTheme.textMuted)
                                    .multilineTextAlignment(.center)
                                    .frame(maxWidth: .infinity)
                            }
                            .buttonStyle(.plain)
                            .padding(.top, 4)
                        }
                        .padding(24)
                        .dommiaCard(cornerRadius: 28)
                        .padding(.horizontal, 20)

                        Spacer(minLength: 24)
                    }
                }
            }
            .sheet(isPresented: $showRecoverySheet) {
                PasswordRecoverySheetView(viewModel: viewModel)
            }
        }
    }

    // MARK: - Subviews
    private var brandingHeader: some View {
        HStack(spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .fill(DommiaTheme.blueBadge)
                    .frame(width: 44, height: 44)

                Image(systemName: "shield.checkered")
                    .font(.system(size: 22, weight: .semibold))
                    .foregroundStyle(DommiaTheme.blueLight)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text("DOMMIA RESIDENT")
                    .font(.system(size: 11, weight: .black))
                    .tracking(2.2)
                    .foregroundStyle(DommiaTheme.blueLight)

                Text("El acceso seguro de tu comunidad")
                    .font(.system(size: 13))
                    .foregroundStyle(DommiaTheme.textMuted)
            }
            Spacer()
        }
        .padding(.horizontal, 24)
    }

    private var cardHeader: some View {
        VStack(alignment: .leading, spacing: 10) {
            ZStack {
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(DommiaTheme.emeraldBadge)
                    .frame(width: 48, height: 48)

                Image(systemName: "lock.fill")
                    .font(.system(size: 22, weight: .semibold))
                    .foregroundStyle(DommiaTheme.emeraldLight)
            }

            Text("Entra a tu comunidad")
                .font(.system(size: 22, weight: .black))
                .foregroundStyle(DommiaTheme.textPrimary)

            Text("Consulta tus cuotas, invitaciones y avisos desde un solo lugar.")
                .font(.system(size: 14))
                .foregroundStyle(DommiaTheme.textMuted)
                .lineSpacing(3)
        }
    }
}

// Sheet para recuperación de contraseña
struct PasswordRecoverySheetView: View {
    @Environment(\.dismiss) private var dismiss
    @Bindable var viewModel: LoginViewModel

    var body: some View {
        NavigationStack {
            ZStack {
                DommiaTheme.surface
                    .ignoresSafeArea()

                VStack(alignment: .leading, spacing: 20) {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Recupera tu acceso")
                            .font(.system(size: 20, weight: .bold))
                            .foregroundStyle(DommiaTheme.textPrimary)

                        Text("Escribe tu correo o celular registrado y tu comunidad para enviarte instrucciones.")
                            .font(.system(size: 14))
                            .foregroundStyle(DommiaTheme.textMuted)
                    }

                    VStack(alignment: .leading, spacing: 14) {
                        VStack(alignment: .leading, spacing: 6) {
                            Text("Correo electrónico o celular")
                                .font(.system(size: 13, weight: .bold))
                                .foregroundStyle(DommiaTheme.textSecondary)

                            TextField("", text: $viewModel.identifier, prompt: Text("correo@ejemplo.com").foregroundColor(DommiaTheme.placeholder))
                                .dommiaTextField()
                        }

                        VStack(alignment: .leading, spacing: 6) {
                            Text("Comunidad (Tenant)")
                                .font(.system(size: 13, weight: .bold))
                                .foregroundStyle(DommiaTheme.textSecondary)

                            TextField("", text: $viewModel.tenantSlug, prompt: Text("demo").foregroundColor(DommiaTheme.placeholder))
                                .dommiaTextField()
                        }
                    }

                    Button {
                        Task {
                            await viewModel.requestPasswordRecovery()
                            dismiss()
                        }
                    } label: {
                        if viewModel.isLoading {
                            ProgressView().tint(.white)
                        } else {
                            Text("Enviar enlace de recuperación")
                                .font(.system(size: 15, weight: .bold))
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 48)
                    .background(DommiaTheme.primaryBlue)
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                    .foregroundStyle(.white)

                    Spacer()
                }
                .padding(24)
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cerrar") { dismiss() }
                        .foregroundStyle(DommiaTheme.textMuted)
                }
            }
        }
    }
}
