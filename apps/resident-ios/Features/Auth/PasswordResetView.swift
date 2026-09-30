import SwiftUI

struct PasswordResetView: View {
    let token: String
    private let authRepository: AuthRepository
    @State private var newPassword = ""
    @State private var confirmation = ""
    @State private var message: String?
    @State private var errorMessage: String?
    @State private var isLoading = false

    init(token: String, authRepository: AuthRepository = AuthRepository()) {
        self.token = token
        self.authRepository = authRepository
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Nueva contraseña") {
                    SecureField("Contraseña", text: $newPassword)
                    SecureField("Confirmar contraseña", text: $confirmation)
                }
                if let message {
                    Text(message).foregroundStyle(.green)
                }
                if let errorMessage {
                    Text(errorMessage).foregroundStyle(.red)
                }
                Button("Restablecer contraseña") {
                    Task { await reset() }
                }
                .disabled(isLoading || newPassword.isEmpty || newPassword != confirmation)
            }
            .navigationTitle("Recuperar acceso")
        }
    }

    private func reset() async {
        isLoading = true
        message = nil
        errorMessage = nil
        defer { isLoading = false }
        do {
            try await authRepository.resetPassword(token: token, newPassword: newPassword)
            message = "Contraseña actualizada. Regresa al login."
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? "No se pudo restablecer la contraseña."
        }
    }
}
