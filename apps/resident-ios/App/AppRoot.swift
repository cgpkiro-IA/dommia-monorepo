import SwiftUI

struct AppRoot: View {
    private let dependencies: AppDependencies
    @State private var loginViewModel: LoginViewModel
    @State private var deepLink: ResidentDeepLink?

    init(dependencies: AppDependencies) {
        self.dependencies = dependencies
        let vm = LoginViewModel(authRepository: dependencies.auth)
        if CommandLine.arguments.contains("-AutoLogin") {
            vm.fillDemoCredentials()
            Task { @MainActor in
                await vm.login()
            }
        }
        _loginViewModel = State(initialValue: vm)
    }

    var body: some View {
        Group {
            if case let .reset(token, _) = deepLink {
                PasswordResetView(token: token, authRepository: dependencies.auth)
            } else if loginViewModel.isAuthenticated {
                ResidentDashboardView(dependencies: dependencies, loginViewModel: loginViewModel)
            } else if loginViewModel.requiresPasswordChange {
                ChangePasswordView(viewModel: loginViewModel)
            } else {
                LoginView(viewModel: loginViewModel)
            }
        }
        .tint(Color(red: 0.12, green: 0.38, blue: 0.82))
        .onOpenURL { url in
            deepLink = ResidentDeepLink(url: url)
        }
    }
}
