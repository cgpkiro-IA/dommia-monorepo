import Foundation

public enum AppEnvironment: Sendable {
    case dev
    case staging
    case prod

    public var apiBaseURL: URL {
        switch self {
        case .dev:
            return URL(string: "http://localhost:4000/api/v1")!
        case .staging:
            return URL(string: "https://staging-api.example.com/api/v1")!
        case .prod:
            return URL(string: "https://api.example.com/api/v1")!
        }
    }

    public static var current: AppEnvironment {
        #if PROD
        return .prod
        #elseif STAGING
        return .staging
        #else
        return .dev
        #endif
    }
}
