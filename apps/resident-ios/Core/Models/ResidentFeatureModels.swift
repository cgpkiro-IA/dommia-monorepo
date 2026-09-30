import Foundation

public struct ResidentProfileResponse: Decodable, Sendable {
    public let resident: ResidentProfile
    public let tenantSlug: String
}

public struct ResidentNotice: Decodable, Identifiable, Sendable {
    public let id: String
    public let title: String
    public let content: String
    public let createdAt: Date?

    enum CodingKeys: String, CodingKey {
        case id
        case title
        case content
        case createdAt = "created_at"
    }
}

public struct ResidentInvitation: Decodable, Identifiable, Sendable {
    public let id: String
    public let visitorName: String
    public let passType: String
    public let validFrom: Date?
    public let validUntil: Date?
    public let status: String?

    enum CodingKeys: String, CodingKey {
        case id
        case visitorName = "visitor_name"
        case passType = "pass_type"
        case validFrom = "valid_from"
        case validUntil = "valid_until"
        case status
    }
}

public struct CreateInvitationRequest: Encodable, Sendable {
    public let visitorName: String
    public let passType: String
    public let validDays: Int
    public let notes: String?
}

public struct AccessCredential: Decodable, Sendable {
    public let code: String?
    public let payload: String?
    public let stepExpiresAt: Date?
}

public struct ResidentFinanceStatus: Decodable, Sendable {
    public let propertyId: String?
    public let totalBalanceDue: Decimal?
    public let hasPendingCharges: Bool?
    public let pendingChargesCount: Int?
}

public struct ResidentFinanceCampaign: Decodable, Identifiable, Sendable {
    public let id: String
    public let name: String?
    public let status: String?
}

public struct ReceiptUploadResult: Decodable, Sendable {
    public let receiptUrl: String
    public let storage: String
    public let contentType: String
    public let sizeBytes: Int
}
