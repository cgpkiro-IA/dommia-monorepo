import Foundation

public struct AccessService: Sendable {
    private let client: APIClient
    private let session: AuthSessionCoordinator

    public init(client: APIClient = APIClient(), sessionCoordinator: AuthSessionCoordinator? = nil, sessionStore: SessionStore = SessionStore()) {
        self.client = client
        self.session = sessionCoordinator ?? AuthSessionCoordinator(client: client, store: sessionStore)
    }

    public func credential() async throws -> AccessCredential {
        let token = try await session.accessToken()
        let response: APIEnvelope<AccessCredential> = try await client.send(
            path: "auth/app/resident/access-credential",
            accessToken: token
        )
        guard let data = response.data else { throw APIError.decoding("La credencial no contiene datos.") }
        return data
    }
}
