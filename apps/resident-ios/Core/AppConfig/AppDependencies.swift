import Foundation

@MainActor
public final class AppDependencies {
    public let client: APIClient
    public let sessionStore: SessionStore
    public let sessionCoordinator: AuthSessionCoordinator
    public let auth: AuthRepository
    public let profile: ProfileService
    public let notices: NoticesService
    public let invitations: InvitationsService
    public let access: AccessService
    public let finance: FinanceService

    public init() {
        let client = APIClient()
        let sessionStore = SessionStore()
        let sessionCoordinator = AuthSessionCoordinator(client: client, store: sessionStore)
        self.client = client
        self.sessionStore = sessionStore
        self.sessionCoordinator = sessionCoordinator
        self.auth = AuthRepository(client: client, sessionStore: sessionStore, sessionCoordinator: sessionCoordinator)
        self.profile = ProfileService(client: client, sessionCoordinator: sessionCoordinator)
        self.notices = NoticesService(client: client, sessionCoordinator: sessionCoordinator)
        self.invitations = InvitationsService(client: client, sessionCoordinator: sessionCoordinator)
        self.access = AccessService(client: client, sessionCoordinator: sessionCoordinator)
        self.finance = FinanceService(client: client, sessionCoordinator: sessionCoordinator)
    }
}
