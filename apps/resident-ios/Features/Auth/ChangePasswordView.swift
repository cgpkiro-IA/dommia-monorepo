import SwiftUI

struct ChangePasswordView: View {
    @Bindable var viewModel: LoginViewModel
    @State private var currentPassword = ""
    @State private var newPassword = ""
    @State private var confirmation = ""

    var body: some View {
        NavigationStack {
            Form {
                Section("Contraseña temporal") {
                    SecureField("Contraseña actual", text: $currentPassword)
                    SecureField("Nueva contraseña", text: $newPassword)
                    SecureField("Confirmar contraseña", text: $confirmation)
                }
                if let errorMessage = viewModel.errorMessage {
                    Text(errorMessage)
                        .foregroundStyle(.red)
                }
                Button("Actualizar contraseña") {
                    Task {
                        guard newPassword == confirmation else {
                            return
                        }
                        await viewModel.changePassword(currentPassword: currentPassword, newPassword: newPassword)
                    }
                }
                .disabled(viewModel.isLoading || currentPassword.isEmpty || newPassword.isEmpty || confirmation.isEmpty)
            }
            .navigationTitle("Actualiza tu contraseña")
        }
    }
}
