import Foundation
import Observation

@MainActor
@Observable
public final class LoginViewModel {
    public var identifier = ""
    public var password = ""
    public var tenantSlug = ""
    public var deviceName = ""
    public private(set) var isLoading = false
    public private(set) var errorMessage: String?
    public private(set) var requiresPasswordChange = false
    public private(set) var isAuthenticated = false

    private let authRepository: AuthRepository

    public init(authRepository: AuthRepository = AuthRepository()) {
        self.authRepository = authRepository
    }

    public func login() async {
        guard !identifier.isEmpty, !password.isEmpty, !tenantSlug.isEmpty else {
            errorMessage = "Completa identificador, contraseña y comunidad."
            return
        }
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            let outcome = try await authRepository.login(
                identifier: identifier,
                password: password,
                tenantSlug: tenantSlug,
                deviceName: deviceName.isEmpty ? nil : deviceName
            )
            switch outcome {
            case .authenticated:
                isAuthenticated = true
                requiresPasswordChange = false
            case .passwordChangeRequired:
                requiresPasswordChange = true
            }
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? "No se pudo iniciar sesión."
        }
    }

    public func changePassword(currentPassword: String, newPassword: String) async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            try await authRepository.changePassword(
                identifier: identifier,
                tenantSlug: tenantSlug,
                currentPassword: currentPassword,
                newPassword: newPassword
            )
            password = ""
            requiresPasswordChange = false
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? "No se pudo actualizar la contraseña."
        }
    }
}
