import Foundation

public struct ProfileService: Sendable {
    private let client: APIClient
    private let session: AuthSessionCoordinator

    public init(client: APIClient = APIClient(), sessionCoordinator: AuthSessionCoordinator? = nil, sessionStore: SessionStore = SessionStore()) {
        self.client = client
        self.session = sessionCoordinator ?? AuthSessionCoordinator(client: client, store: sessionStore)
    }

    public func me() async throws -> ResidentProfileResponse {
        let token = try await session.accessToken()
        let response: APIEnvelope<ResidentProfileResponse> = try await client.send(path: "auth/app/resident/me", accessToken: token)
        guard let data = response.data else { throw APIError.decoding("Perfil sin datos.") }
        return data
    }
}
