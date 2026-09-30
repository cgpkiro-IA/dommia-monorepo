import Foundation

public enum APIError: LocalizedError, Sendable {
    case invalidURL
    case invalidResponse
    case transport(String)
    case server(statusCode: Int, message: String)
    case decoding(String)
    case missingSession

    public var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "No se pudo construir la solicitud."
        case .invalidResponse:
            return "El servidor devolvió una respuesta inválida."
        case .transport:
            return "No se pudo conectar con DOMMIA."
        case let .server(statusCode, message):
            return statusCode == 401 ? "Tu sesión expiró o fue revocada." : message
        case .decoding:
            return "La respuesta del servidor no pudo procesarse."
        case .missingSession:
            return "No hay una sesión activa."
        }
    }
}
