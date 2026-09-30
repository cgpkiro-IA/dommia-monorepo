import Foundation

public struct FinanceService: Sendable {
    private let client: APIClient
    private let session: AuthSessionCoordinator

    public init(client: APIClient = APIClient(), sessionCoordinator: AuthSessionCoordinator? = nil, sessionStore: SessionStore = SessionStore()) {
        self.client = client
        self.session = sessionCoordinator ?? AuthSessionCoordinator(client: client, store: sessionStore)
    }

    public func status() async throws -> ResidentFinanceStatus {
        let token = try await session.accessToken()
        let response: APIEnvelope<ResidentFinanceStatus> = try await client.send(
            path: "auth/app/resident/finance/status",
            accessToken: token
        )
        guard let data = response.data else { throw APIError.decoding("El estado financiero no contiene datos.") }
        return data
    }

    public func campaigns() async throws -> [ResidentFinanceCampaign] {
        let token = try await session.accessToken()
        let response: APIEnvelope<[ResidentFinanceCampaign]> = try await client.send(
            path: "auth/app/resident/finance/campaigns",
            accessToken: token
        )
        return response.data ?? []
    }

    public func uploadReceipt(contentBase64: String, contentType: String) async throws -> ReceiptUploadResult {
        let token = try await session.accessToken()
        let response: APIEnvelope<ReceiptUploadResult> = try await client.send(
            path: "auth/app/resident/finance/receipts",
            method: "POST",
            body: ReceiptUploadRequest(contentBase64: contentBase64, contentType: contentType),
            accessToken: token
        )
        guard let data = response.data else { throw APIError.decoding("El comprobante no contiene referencia.") }
        return data
    }

    public func monthlyReports() async throws -> [MonthlyFinancialReport] {
        let token = try await session.accessToken()
        let response: APIEnvelope<[MonthlyFinancialReport]> = try await client.send(
            path: "auth/app/resident/finance/monthly-reports",
            accessToken: token
        )
        return response.data ?? []
    }

    public func markMonthlyReportReviewed(id: String) async throws -> Date? {
        let token = try await session.accessToken()
        let response: APIEnvelope<MonthlyReportReviewResult> = try await client.send(
            path: "auth/app/resident/finance/monthly-reports/\(id)/review",
            method: "POST",
            body: EmptyRequest(),
            accessToken: token
        )
        return response.data?.reviewedAt
    }

    public func downloadMonthlyEvidence(id: String) async throws -> Data {
        let token = try await session.accessToken()
        return try await client.download(
            path: "auth/app/resident/finance/monthly-reports/evidence/\(id)/content",
            accessToken: token
        )
    }
}

private struct ReceiptUploadRequest: Encodable, Sendable {
    let contentBase64: String
    let contentType: String
}
