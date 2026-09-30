import Foundation

public enum ResidentDeepLink: Sendable {
    case activate(token: String, tenant: String?)
    case reset(token: String, tenant: String?)

    public init?(url: URL) {
        guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
              let token = components.queryItems?.first(where: { $0.name == "token" })?.value,
              !token.isEmpty,
              components.queryItems?.filter({ $0.name == "token" }).count == 1 else {
            return nil
        }
        let tenant = components.queryItems?.first(where: { $0.name == "tenant" })?.value
        switch components.path {
        case "/activate-resident":
            self = .activate(token: token, tenant: tenant)
        case "/reset-resident":
            self = .reset(token: token, tenant: tenant)
        default:
            return nil
        }
    }
}
