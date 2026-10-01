import Foundation

public struct APIClient: Sendable {
    public let baseURL: URL
    private let session: URLSession
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder

    public init(baseURL: URL = AppEnvironment.current.apiBaseURL, session: URLSession = .shared) {
        self.baseURL = baseURL.absoluteString.hasSuffix("/")
            ? baseURL
            : URL(string: baseURL.absoluteString + "/")!
        self.session = session
        self.decoder = JSONDecoder()
        self.encoder = JSONEncoder()
        self.decoder.dateDecodingStrategy = .iso8601
        self.encoder.dateEncodingStrategy = .iso8601
    }

    public func send<Response: Decodable, Body: Encodable & Sendable>(
        path: String,
        method: String = "GET",
        body: Body? = nil,
        accessToken: String? = nil
    ) async throws -> APIEnvelope<Response> {
        guard let url = URL(string: path, relativeTo: baseURL)?.absoluteURL else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        if let accessToken {
            request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        }
        if let body {
            request.httpBody = try encoder.encode(body)
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await session.data(for: request)
        } catch {
            throw APIError.transport(error.localizedDescription)
        }

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        if !(200...299).contains(httpResponse.statusCode) {
            let errorEnvelope = try? decoder.decode(APIEnvelope<EmptyResponse>.self, from: data)
            throw APIError.server(
                statusCode: httpResponse.statusCode,
                message: errorEnvelope?.message ?? "La solicitud no pudo procesarse."
            )
        }

        do {
            return try decoder.decode(APIEnvelope<Response>.self, from: data)
        } catch {
            throw APIError.decoding(error.localizedDescription)
        }
    }

    public func download(path: String, accessToken: String) async throws -> Data {
        guard let url = URL(string: path, relativeTo: baseURL)?.absoluteURL else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        request.setValue("application/octet-stream", forHTTPHeaderField: "Accept")

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await session.data(for: request)
        } catch {
            throw APIError.transport(error.localizedDescription)
        }

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        guard (200...299).contains(httpResponse.statusCode) else {
            let errorEnvelope = try? decoder.decode(APIEnvelope<EmptyResponse>.self, from: data)
            throw APIError.server(statusCode: httpResponse.statusCode, message: errorEnvelope?.message ?? "La evidencia no está disponible.")
        }
        return data
    }
}

public struct EmptyResponse: Decodable, Sendable {
    public init() {}
}
