import Foundation

public enum LoginOutcome: Sendable {
    case authenticated(ResidentAppLoginData)
    case passwordChangeRequired(tenantSlug: String)
}

public final class AuthRepository: @unchecked Sendable {
    private let client: APIClient
    private let sessionStore: SessionStore
    private let sessionCoordinator: AuthSessionCoordinator
    private let keychain: KeychainStore
    private let deviceAccount = "resident.device-id"

    public init(
        client: APIClient = APIClient(),
        sessionStore: SessionStore = SessionStore(),
        sessionCoordinator: AuthSessionCoordinator? = nil
    ) {
        self.client = client
        self.sessionStore = sessionStore
        self.sessionCoordinator = sessionCoordinator ?? AuthSessionCoordinator(client: client, store: sessionStore)
        self.keychain = KeychainStore()
    }

    public func login(identifier: String, password: String, tenantSlug: String, deviceName: String?) async throws -> LoginOutcome {
        let response: APIEnvelope<ResidentAppLoginData> = try await client.send(
            path: "auth/app/resident/login",
            method: "POST",
            body: ResidentAppLoginRequest(
                identifier: identifier,
                password: password,
                tenantSlug: tenantSlug,
                clientType: "IOS",
                deviceId: try deviceId(),
                deviceName: deviceName
            )
        )
        guard let data = response.data else { throw APIError.decoding("Login sin datos.") }
        if data.passwordChangeRequired == true {
            return .passwordChangeRequired(tenantSlug: data.tenantSlug)
        }
        guard let accessToken = data.accessToken, let refreshToken = data.refreshToken else {
            throw APIError.decoding("Login sin tokens.")
        }
        try await sessionStore.save(accessToken: accessToken, refreshToken: refreshToken)
        return .authenticated(data)
    }

    public func changePassword(
        identifier: String,
        tenantSlug: String,
        currentPassword: String,
        newPassword: String
    ) async throws {
        let _: APIEnvelope<PasswordChangeResult> = try await client.send(
            path: "auth/app/resident/change-password",
            method: "POST",
            body: ResidentAppChangePasswordRequest(
                identifier: identifier,
                tenantSlug: tenantSlug,
                currentPassword: currentPassword,
                newPassword: newPassword
            )
        )
        try await sessionCoordinator.clear()
    }

    public func requestPasswordRecovery(identifier: String, tenantSlug: String) async throws {
        let _: APIEnvelope<EmptyResponse> = try await client.send(
            path: "auth/app/resident/password-recovery",
            method: "POST",
            body: ResidentAppPasswordRecoveryRequest(identifier: identifier, tenantSlug: tenantSlug)
        )
    }

    public func resetPassword(token: String, newPassword: String) async throws {
        let _: APIEnvelope<ResidentProfile> = try await client.send(
            path: "auth/app/resident/password-reset",
            method: "POST",
            body: ResidentAppPasswordResetRequest(token: token, newPassword: newPassword)
        )
        try await sessionCoordinator.clear()
    }

    public func logout() async {
        guard let accessToken = await sessionStore.accessToken else {
            await sessionCoordinator.clear()
            return
        }
        let request = EmptyRequest()
        let _: APIEnvelope<EmptyResponse>? = try? await client.send(
            path: "auth/app/resident/logout",
            method: "POST",
            body: request,
            accessToken: accessToken
        )
        await sessionCoordinator.clear()
    }

    public func accessToken() async throws -> String {
        try await sessionCoordinator.accessToken()
    }

    private func deviceId() throws -> String {
        if let stored = try keychain.read(account: deviceAccount) { return stored }
        let generated = UUID().uuidString
        try keychain.save(generated, account: deviceAccount)
        return generated
    }
}

public struct EmptyRequest: Encodable, Sendable {
    public init() {}
}
