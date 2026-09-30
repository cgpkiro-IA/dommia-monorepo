import Foundation

public struct InvitationsService: Sendable {
    private let client: APIClient
    private let session: AuthSessionCoordinator

    public init(client: APIClient = APIClient(), sessionCoordinator: AuthSessionCoordinator? = nil, sessionStore: SessionStore = SessionStore()) {
        self.client = client
        self.session = sessionCoordinator ?? AuthSessionCoordinator(client: client, store: sessionStore)
    }

    public func list() async throws -> [ResidentInvitation] {
        let token = try await session.accessToken()
        let response: APIEnvelope<[ResidentInvitation]> = try await client.send(path: "auth/app/resident/invitations", accessToken: token)
        return response.data ?? []
    }

    public func create(_ request: CreateInvitationRequest) async throws -> ResidentInvitation {
        let token = try await session.accessToken()
        let response: APIEnvelope<ResidentInvitation> = try await client.send(
            path: "auth/app/resident/invitations",
            method: "POST",
            body: request,
            accessToken: token
        )
        guard let data = response.data else { throw APIError.decoding("La invitación no contiene datos.") }
        return data
    }

    public func revoke(id: String) async throws {
        let token = try await session.accessToken()
        let _: APIEnvelope<EmptyResponse> = try await client.send(
            path: "auth/app/resident/invitations/\(id)",
            method: "DELETE",
            body: EmptyRequest(),
            accessToken: token
        )
    }
}
