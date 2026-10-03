import SwiftUI

public struct PasswordResetView: View {
    public let token: String
    private let authRepository: AuthRepository
    @State private var newPassword = ""
    @State private var confirmation = ""
    @State private var message: String?
    @State private var errorMessage: String?
    @State private var isLoading = false

    public init(token: String, authRepository: AuthRepository = AuthRepository()) {
        self.token = token
        self.authRepository = authRepository
    }

    public var body: some View {
        NavigationStack {
            ZStack {
                DommiaTheme.canvas
                    .ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        HStack(spacing: 12) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 16)
                                    .fill(DommiaTheme.emeraldBadge)
                                    .frame(width: 48, height: 48)

                                Image(systemName: "lock.rotation")
                                    .font(.system(size: 22))
                                    .foregroundStyle(DommiaTheme.emeraldLight)
                            }

                            VStack(alignment: .leading, spacing: 2) {
                                Text("Define una nueva contraseña")
                                    .font(.system(size: 20, weight: .black))
                                    .foregroundStyle(.white)

                                Text("Crea una contraseña segura para continuar.")
                                    .font(.system(size: 13))
                                    .foregroundStyle(DommiaTheme.textMuted)
                            }
                        }

                        VStack(alignment: .leading, spacing: 14) {
                            VStack(alignment: .leading, spacing: 6) {
                                Text("Nueva contraseña")
                                    .font(.system(size: 13, weight: .bold))
                                    .foregroundStyle(DommiaTheme.textSecondary)

                                SecureField("", text: $newPassword, prompt: Text("••••••••••••").foregroundColor(DommiaTheme.placeholder))
                                    .dommiaTextField()
                            }

                            VStack(alignment: .leading, spacing: 6) {
                                Text("Confirmar contraseña")
                                    .font(.system(size: 13, weight: .bold))
                                    .foregroundStyle(DommiaTheme.textSecondary)

                                SecureField("", text: $confirmation, prompt: Text("••••••••••••").foregroundColor(DommiaTheme.placeholder))
                                    .dommiaTextField()
                            }
                        }

                        if let message {
                            HStack(spacing: 8) {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundStyle(DommiaTheme.emerald)
                                Text(message)
                                    .font(.system(size: 13))
                                    .foregroundStyle(.white)
                            }
                            .padding(12)
                            .background(DommiaTheme.emeraldDark)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                        }

                        if let errorMessage {
                            HStack(spacing: 8) {
                                Image(systemName: "exclamationmark.triangle.fill")
                                    .foregroundStyle(DommiaTheme.danger)
                                Text(errorMessage)
                                    .font(.system(size: 13))
                                    .foregroundStyle(.white)
                            }
                            .padding(12)
                            .background(DommiaTheme.dangerDark)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                        }

                        Button {
                            Task { await reset() }
                        } label: {
                            if isLoading {
                                ProgressView().tint(.white)
                            } else {
                                Text("Guardar nueva contraseña")
                                    .font(.system(size: 15, weight: .bold))
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 50)
                        .background(DommiaTheme.primaryBlue)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                        .foregroundStyle(.white)
                        .disabled(isLoading || newPassword.isEmpty || newPassword != confirmation)
                    }
                    .padding(24)
                    .dommiaCard(cornerRadius: 28)
                    .padding(.horizontal, 20)
                    .padding(.top, 20)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
        }
    }

    private func reset() async {
        isLoading = true
        message = nil
        errorMessage = nil
        defer { isLoading = false }
        do {
            try await authRepository.resetPassword(token: token, newPassword: newPassword)
            message = "Contraseña actualizada. Ya puedes iniciar sesión."
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? "No se pudo restablecer la contraseña."
        }
    }
}
