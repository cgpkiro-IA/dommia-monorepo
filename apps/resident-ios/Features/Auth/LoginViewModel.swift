import Foundation
import Observation

@MainActor
@Observable
public final class LoginViewModel {
    #if DEV
    public var identifier = "carlos.mendoza@gmail.com"
    public var password = "Residente2026!"
    #else
    public var identifier = ""
    public var password = ""
    #endif
    public var tenantSlug = "demo"
    public var deviceName = "iPhone de Carlos"
    public private(set) var isLoading = false
    public private(set) var errorMessage: String?
    public private(set) var successMessage: String?
    public private(set) var requiresPasswordChange = false
    public private(set) var isAuthenticated = false

    private let authRepository: AuthRepository

    public init(authRepository: AuthRepository = AuthRepository()) {
        self.authRepository = authRepository
    }

    public func fillDemoCredentials() {
        identifier = "carlos.mendoza@gmail.com"
        tenantSlug = "demo"
        password = "Residente2026!"
        deviceName = "iPhone de Carlos"
        errorMessage = nil
        successMessage = nil
    }

    public func login() async {
        guard !identifier.trimmingCharacters(in: .whitespaces).isEmpty,
              !password.isEmpty,
              !tenantSlug.trimmingCharacters(in: .whitespaces).isEmpty else {
            errorMessage = "Completa tu correo/celular, contraseña y comunidad."
            return
        }
        isLoading = true
        errorMessage = nil
        successMessage = nil
        defer { isLoading = false }
        do {
            let outcome = try await authRepository.login(
                identifier: identifier.trimmingCharacters(in: .whitespaces),
                password: password,
                tenantSlug: tenantSlug.trimmingCharacters(in: .whitespaces),
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
            errorMessage = (error as? LocalizedError)?.errorDescription ?? "No se pudo iniciar sesión. Verifica tus credenciales."
        }
    }

    public func logout() async {
        isLoading = true
        defer { isLoading = false }
        try? await authRepository.logout()
        isAuthenticated = false
        password = ""
    }

    public func requestPasswordRecovery() async {
        guard !identifier.trimmingCharacters(in: .whitespaces).isEmpty,
              !tenantSlug.trimmingCharacters(in: .whitespaces).isEmpty else {
            errorMessage = "Escribe tu correo o celular y la comunidad para recuperar acceso."
            return
        }
        isLoading = true
        errorMessage = nil
        successMessage = nil
        defer { isLoading = false }
        do {
            try await authRepository.requestPasswordRecovery(
                identifier: identifier.trimmingCharacters(in: .whitespaces),
                tenantSlug: tenantSlug.trimmingCharacters(in: .whitespaces)
            )
            successMessage = "Si la cuenta existe, se enviaron instrucciones de recuperación a tu correo."
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? "No se pudo solicitar la recuperación."
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
            isAuthenticated = true
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? "No se pudo actualizar la contraseña."
        }
    }
}
