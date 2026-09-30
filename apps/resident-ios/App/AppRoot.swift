import SwiftUI

struct AppRoot: View {
    private let dependencies: AppDependencies
    @State private var loginViewModel: LoginViewModel
    @State private var deepLink: ResidentDeepLink?

    init(dependencies: AppDependencies) {
        self.dependencies = dependencies
        _loginViewModel = State(initialValue: LoginViewModel(authRepository: dependencies.auth))
    }

    var body: some View {
        Group {
            if case let .reset(token, _) = deepLink {
                PasswordResetView(token: token, authRepository: dependencies.auth)
            } else if loginViewModel.isAuthenticated {
                Text("DOMMIA Resident")
                    .font(.title2.weight(.semibold))
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
