import Foundation

public struct NoticesService: Sendable {
    private let client: APIClient
    private let session: AuthSessionCoordinator

    public init(client: APIClient = APIClient(), sessionCoordinator: AuthSessionCoordinator? = nil, sessionStore: SessionStore = SessionStore()) {
        self.client = client
        self.session = sessionCoordinator ?? AuthSessionCoordinator(client: client, store: sessionStore)
    }

    public func list() async throws -> [ResidentNotice] {
        let token = try await session.accessToken()
        let response: APIEnvelope<[ResidentNotice]> = try await client.send(path: "auth/app/resident/notices", accessToken: token)
        return response.data ?? []
    }
}
