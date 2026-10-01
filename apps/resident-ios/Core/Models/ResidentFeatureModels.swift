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

public struct MonthlyFinancialReport: Decodable, Identifiable, Sendable {
    public let id: String
    public let periodStart: String
    public let revision: Int
    public let publishedAt: Date?
    public let reviewedByCurrentResident: Bool
    public let reportSnapshot: MonthlyReportSnapshot

    enum CodingKeys: String, CodingKey {
        case id, revision
        case periodStart = "period_start"
        case publishedAt = "published_at"
        case reviewedByCurrentResident = "reviewed_by_current_resident"
        case reportSnapshot = "report_snapshot"
    }
}

public struct MonthlyReportSnapshot: Decodable, Sendable {
    public let opening: MonthlyReportOpening
    public let income: MonthlyReportTotal
    public let expenses: MonthlyReportExpenses
    public let reportEvidence: [MonthlyReportEvidence]
    public let activity: MonthlyReportActivity
    public let closing: MonthlyReportClosing
}

public struct MonthlyReportOpening: Decodable, Sendable {
    public let bank: Decimal
    public let cash: Decimal
    public let total: Decimal
}

public struct MonthlyReportTotal: Decodable, Sendable {
    public let total: Decimal
    public let regular: [MonthlyReportIncomeLine]
    public let annualAdvance: MonthlyReportAnnualAdvance
}

public struct MonthlyReportIncomeLine: Decodable, Sendable {
    public let category: String
    public let paymentMethod: String
    public let count: Int
    public let amount: Decimal
}

public struct MonthlyReportAnnualAdvance: Decodable, Sendable {
    public let count: Int
    public let amount: Decimal
}

public struct MonthlyReportExpenses: Decodable, Sendable {
    public let total: Decimal
    public let byCategory: [MonthlyReportCategory]
    public let items: [MonthlyReportExpenseItem]
}

public struct MonthlyReportCategory: Decodable, Sendable {
    public let category: String
    public let count: Int
    public let amount: Decimal
}

public struct MonthlyReportExpenseItem: Decodable, Sendable {
    public let id: String
    public let category: String
    public let description: String
    public let vendorName: String?
    public let expenseDate: String
    public let amount: Decimal
    public let evidence: [MonthlyReportEvidence]
}

public struct MonthlyReportEvidence: Decodable, Identifiable, Sendable {
    public let id: String
    public let fileName: String
    public let contentType: String
    public let sizeBytes: Int
}

public struct MonthlyReportActivity: Decodable, Sendable {
    public let pendingPaymentCount: Int
    public let pendingPaymentAmount: Decimal
    public let chargesIssuedCount: Int
    public let chargesIssuedAmount: Decimal
    public let chargesOutstandingAmount: Decimal
}

public struct MonthlyReportClosing: Decodable, Sendable {
    public let calculated: Decimal
    public let reportedBank: Decimal
    public let reportedCash: Decimal
    public let reportedTotal: Decimal
    public let variance: Decimal
}

public struct MonthlyReportReviewResult: Decodable, Sendable { public let reviewedAt: Date? }
