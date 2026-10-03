import SwiftUI

public struct ChangePasswordView: View {
    @Bindable var viewModel: LoginViewModel
    @State private var currentPassword = ""
    @State private var newPassword = ""
    @State private var confirmation = ""
    @State private var localError: String?

    public init(viewModel: LoginViewModel) {
        self.viewModel = viewModel
    }

    private var hasTenChars: Bool { newPassword.count >= 10 }
    private var hasUppercase: Bool { newPassword.rangeOfCharacter(from: .uppercaseLetters) != nil }
    private var hasLowercase: Bool { newPassword.rangeOfCharacter(from: .lowercaseLetters) != nil }
    private var hasNumber: Bool { newPassword.rangeOfCharacter(from: .decimalDigits) != nil }
    private var hasSymbol: Bool {
        let specialChars = CharacterSet.alphanumerics.inverted
        return newPassword.rangeOfCharacter(from: specialChars) != nil
    }
    private var passwordsMatch: Bool { !newPassword.isEmpty && newPassword == confirmation }
    private var isPasswordValid: Bool {
        hasTenChars && hasUppercase && hasLowercase && hasNumber && hasSymbol && passwordsMatch
    }

    public var body: some View {
        NavigationStack {
            ZStack {
                DommiaTheme.canvas
                    .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 20) {
                        VStack(alignment: .leading, spacing: 20) {
                            // Header
                            HStack(spacing: 12) {
                                ZStack {
                                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                                        .fill(DommiaTheme.emeraldBadge)
                                        .frame(width: 48, height: 48)

                                    Image(systemName: "key.fill")
                                        .font(.system(size: 20, weight: .bold))
                                        .foregroundStyle(DommiaTheme.emeraldLight)
                                }

                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Actualiza tu contraseña")
                                        .font(.system(size: 20, weight: .black))
                                        .foregroundStyle(DommiaTheme.textPrimary)

                                    Text("Tu contraseña temporal debe cambiarse antes de continuar.")
                                        .font(.system(size: 13))
                                        .foregroundStyle(DommiaTheme.textMuted)
                                }
                            }

                            // Inputs
                            VStack(alignment: .leading, spacing: 14) {
                                VStack(alignment: .leading, spacing: 6) {
                                    Text("Contraseña actual (temporal)")
                                        .font(.system(size: 13, weight: .bold))
                                        .foregroundStyle(DommiaTheme.textSecondary)

                                    SecureField("", text: $currentPassword, prompt: Text("••••••••••••").foregroundColor(DommiaTheme.placeholder))
                                        .dommiaTextField()
                                }

                                VStack(alignment: .leading, spacing: 6) {
                                    Text("Nueva contraseña personal")
                                        .font(.system(size: 13, weight: .bold))
                                        .foregroundStyle(DommiaTheme.textSecondary)

                                    SecureField("", text: $newPassword, prompt: Text("••••••••••••").foregroundColor(DommiaTheme.placeholder))
                                        .dommiaTextField()
                                }

                                VStack(alignment: .leading, spacing: 6) {
                                    Text("Confirmar nueva contraseña")
                                        .font(.system(size: 13, weight: .bold))
                                        .foregroundStyle(DommiaTheme.textSecondary)

                                    SecureField("", text: $confirmation, prompt: Text("••••••••••••").foregroundColor(DommiaTheme.placeholder))
                                        .dommiaTextField()
                                }
                            }

                            // Requirements Checklist
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Requisitos de seguridad:")
                                    .font(.system(size: 12, weight: .bold))
                                    .foregroundStyle(DommiaTheme.textMuted)

                                ruleRow("Al menos 10 caracteres", valid: hasTenChars)
                                ruleRow("Una letra mayúscula", valid: hasUppercase)
                                ruleRow("Una letra minúscula", valid: hasLowercase)
                                ruleRow("Un número", valid: hasNumber)
                                ruleRow("Un símbolo especial", valid: hasSymbol)
                                ruleRow("Las contraseñas coinciden", valid: passwordsMatch)
                            }
                            .padding(14)
                            .background(DommiaTheme.inputBackground)
                            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))

                            // Error banner
                            if let error = localError ?? viewModel.errorMessage {
                                HStack(spacing: 8) {
                                    Image(systemName: "exclamationmark.triangle.fill")
                                        .foregroundStyle(DommiaTheme.danger)
                                    Text(error)
                                        .font(.system(size: 13))
                                        .foregroundStyle(.white)
                                }
                                .padding(12)
                                .background(DommiaTheme.dangerDark)
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                            }

                            // Submit Button
                            Button {
                                guard isPasswordValid else {
                                    localError = "Cumple todos los requisitos de seguridad antes de continuar."
                                    return
                                }
                                localError = nil
                                Task {
                                    await viewModel.changePassword(
                                        currentPassword: currentPassword,
                                        newPassword: newPassword
                                    )
                                }
                            } label: {
                                if viewModel.isLoading {
                                    ProgressView().tint(.white)
                                } else {
                                    Text("Guardar y acceder a DOMMIA")
                                        .font(.system(size: 15, weight: .bold))
                                }
                            }
                            .frame(maxWidth: .infinity)
                            .frame(height: 50)
                            .background(isPasswordValid ? DommiaTheme.primaryBlue : DommiaTheme.borderLight)
                            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                            .foregroundStyle(.white)
                            .disabled(!isPasswordValid || viewModel.isLoading)
                        }
                        .padding(24)
                        .dommiaCard(cornerRadius: 28)
                        .padding(.horizontal, 20)
                        .padding(.top, 16)
                    }
                }
            }
            .navigationBarTitleDisplayMode(.inline)
        }
    }

    private func ruleRow(_ label: String, valid: Bool) -> some View {
        HStack(spacing: 8) {
            Image(systemName: valid ? "checkmark.circle.fill" : "circle")
                .font(.system(size: 14))
                .foregroundStyle(valid ? DommiaTheme.emerald : DommiaTheme.textMuted)

            Text(label)
                .font(.system(size: 12))
                .foregroundStyle(valid ? DommiaTheme.textPrimary : DommiaTheme.textMuted)
        }
    }
}
