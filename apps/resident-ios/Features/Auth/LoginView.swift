import SwiftUI

struct LoginView: View {
    @Bindable var viewModel: LoginViewModel

    var body: some View {
        NavigationStack {
            Form {
                Section("Comunidad") {
                    TextField("Tenant slug", text: $viewModel.tenantSlug)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                }
                Section("Acceso") {
                    TextField("Correo o teléfono", text: $viewModel.identifier)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                    SecureField("Contraseña", text: $viewModel.password)
                    TextField("Nombre del dispositivo", text: $viewModel.deviceName)
                }
                if let errorMessage = viewModel.errorMessage {
                    Text(errorMessage)
                        .foregroundStyle(.red)
                }
                Button {
                    Task { await viewModel.login() }
                } label: {
                    if viewModel.isLoading {
                        ProgressView()
                            .frame(maxWidth: .infinity)
                    } else {
                        Text("Iniciar sesión")
                            .frame(maxWidth: .infinity)
                    }
                }
                .disabled(viewModel.isLoading)
            }
            .navigationTitle("DOMMIA Resident")
        }
    }
}
