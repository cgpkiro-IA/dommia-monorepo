import Foundation

public struct APIEnvelope<Value: Decodable>: Decodable {
    public let success: Bool
    public let message: String?
    public let data: Value?
    public let statusCode: Int?
    public let error: String?
}

public struct ResidentAppLoginRequest: Encodable, Sendable {
    public let identifier: String
    public let password: String
    public let tenantSlug: String
    public let clientType: String
    public let deviceId: String
    public let deviceName: String?
}

public struct ResidentAppLoginData: Decodable, Sendable {
    public let accessToken: String?
    public let refreshToken: String?
    public let tokenType: String?
    public let expiresIn: Int?
    public let refreshExpiresAt: Date?
    public let resident: ResidentProfile?
    public let tenantSlug: String
    public let clientType: String?
    public let deviceId: String?
    public let deviceName: String?
    public let passwordChangeRequired: Bool?
}

public struct ResidentProfile: Decodable, Sendable {
    public let id: String
    public let propertyId: String?
    public let firstName: String?
    public let lastName: String?
    public let email: String?
    public let phone: String?
    public let role: String?
    public let isPrimary: Bool?
    public let isActive: Bool?

    enum CodingKeys: String, CodingKey {
        case id
        case propertyId = "property_id"
        case firstName = "first_name"
        case lastName = "last_name"
        case email
        case phone
        case role
        case isPrimary = "is_primary"
        case isActive = "is_active"
    }
}

public struct ResidentAppRefreshRequest: Encodable, Sendable {
    public let refreshToken: String
}

public struct ResidentAppChangePasswordRequest: Encodable, Sendable {
    public let identifier: String
    public let tenantSlug: String
    public let currentPassword: String
    public let newPassword: String
}

public struct ResidentAppPasswordRecoveryRequest: Encodable, Sendable {
    public let identifier: String
    public let tenantSlug: String
}

public struct ResidentAppPasswordResetRequest: Encodable, Sendable {
    public let token: String
    public let newPassword: String
}

public struct PasswordChangeResult: Decodable, Sendable {
    public let revokedSessions: Int?
}
