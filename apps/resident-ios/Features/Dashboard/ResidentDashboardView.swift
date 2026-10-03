import SwiftUI

public struct ResidentDashboardView: View {
    public let dependencies: AppDependencies
    @Bindable public var loginViewModel: LoginViewModel

    @State private var activeTab: ResidentTabKey = .credential
    @State private var profile: ResidentProfile?
    @State private var tenantSlug: String = "demo"
    @State private var isLoadingProfile = false

    public init(dependencies: AppDependencies, loginViewModel: LoginViewModel) {
        self.dependencies = dependencies
        self.loginViewModel = loginViewModel
    }

    public var body: some View {
        ZStack {
            DommiaTheme.canvas
                .ignoresSafeArea()

            VStack(spacing: 0) {
                // Top Bar
                ResidentTopBar(tenantSlug: tenantSlug) {
                    Task {
                        await loginViewModel.logout()
                    }
                }

                // Tab Content
                ZStack {
                    switch activeTab {
                    case .credential:
                        CredentialTabView(
                            profile: profile,
                            tenantSlug: tenantSlug
                        ) { nextTab in
                            activeTab = nextTab
                        }

                    case .passes:
                        PassesTabView(invitationsService: dependencies.invitations)

                    case .notices:
                        NoticesTabView(noticesService: dependencies.notices)

                    case .finance:
                        FinanceTabView(financeService: dependencies.finance)
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)

                // Bottom Tab Bar
                ResidentTabBar(activeTab: $activeTab, noticesCount: 2)
            }
        }
        .task {
            await loadProfile()
        }
    }

    private func loadProfile() async {
        isLoadingProfile = true
        defer { isLoadingProfile = false }
        do {
            let res = try await dependencies.profile.me()
            self.profile = res.resident
            self.tenantSlug = res.tenantSlug
        } catch {
            // Fallback al default demo
            self.tenantSlug = loginViewModel.tenantSlug.isEmpty ? "demo" : loginViewModel.tenantSlug
        }
    }
}
