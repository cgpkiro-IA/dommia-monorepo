import Foundation

/// Servidor mock local embebido para el entorno DEV del cliente iOS.
/// Intercepta las llamadas HTTP mediante URLProtocol para devolver respuestas
/// conformes al contrato del API sin requerir el backend levantado.
public final class MockServer {
    public static func makeSession() -> URLSession {
        let configuration = URLSessionConfiguration.ephemeral
        configuration.protocolClasses = [MockURLProtocol.self]
        return URLSession(configuration: configuration)
    }
}

public final class MockURLProtocol: URLProtocol {
    public override class func canInit(with request: URLRequest) -> Bool {
        return true
    }

    public override class func canonicalRequest(for request: URLRequest) -> URLRequest {
        return request
    }

    public override func startLoading() {
        guard let url = request.url else {
            client?.urlProtocol(self, didFailWithError: URLError(.badURL))
            return
        }

        let path = url.path
        let method = request.httpMethod?.uppercased() ?? "GET"
        let (statusCode, responseJson) = route(path: path, method: method)

        let responseData = responseJson.data(using: .utf8) ?? Data()
        let httpResponse = HTTPURLResponse(
            url: url,
            statusCode: statusCode,
            httpVersion: "HTTP/1.1",
            headerFields: [
                "Content-Type": "application/json",
                "Content-Length": "\(responseData.count)"
            ]
        )!

        client?.urlProtocol(self, didReceive: httpResponse, cacheStoragePolicy: .notAllowed)
        client?.urlProtocol(self, didLoad: responseData)
        client?.urlProtocolDidFinishLoading(self)
    }

    public override func stopLoading() {}

    private func route(path: String, method: String) -> (Int, String) {
        if path.hasSuffix("/auth/app/resident/login") && method == "POST" {
            return (200, """
            {
              "success": true,
              "message": "Sesión mock iniciada exitosamente",
              "data": {
                "accessToken": "mock-access-token-ios-valid",
                "refreshToken": "mock-refresh-token-ios-valid",
                "tokenType": "Bearer",
                "expiresIn": 3600,
                "refreshExpiresAt": "2027-01-01T00:00:00Z",
                "resident": {
                  "id": "res_demo_001",
                  "property_id": "prop_olivos_101",
                  "first_name": "Carlos",
                  "last_name": "Mendoza",
                  "email": "carlos.mendoza@gmail.com",
                  "phone": "+52 81 8123 4567",
                  "role": "RESIDENT",
                  "is_primary": true,
                  "is_active": true
                },
                "tenantSlug": "demo",
                "clientType": "IOS",
                "deviceId": "mock-device-uuid",
                "deviceName": "iPhone Simulator",
                "passwordChangeRequired": false
              }
            }
            """)
        }

        if path.hasSuffix("/auth/app/resident/refresh") && method == "POST" {
            return (200, """
            {
              "success": true,
              "message": "Token renovado (MOCK)",
              "data": {
                "accessToken": "mock-refreshed-access-token",
                "refreshToken": "mock-refreshed-refresh-token",
                "tokenType": "Bearer",
                "expiresIn": 3600,
                "refreshExpiresAt": "2027-01-01T00:00:00Z",
                "tenantSlug": "demo"
              }
            }
            """)
        }

        if path.hasSuffix("/auth/app/resident/logout") && method == "POST" {
            return (200, """
            {
              "success": true,
              "message": "Sesión cerrada correctamente",
              "data": null
            }
            """)
        }

        if path.hasSuffix("/auth/app/resident/change-password") && method == "POST" {
            return (200, """
            {
              "success": true,
              "message": "Contraseña actualizada exitosamente",
              "data": {
                "revokedSessions": 1
              }
            }
            """)
        }

        if path.hasSuffix("/auth/app/resident/password-recovery") && method == "POST" {
            return (200, """
            {
              "success": true,
              "message": "Si la cuenta existe, se ha enviado un correo con instrucciones",
              "data": null
            }
            """)
        }

        if path.hasSuffix("/auth/app/resident/password-reset") && method == "POST" {
            return (200, """
            {
              "success": true,
              "message": "Contraseña restablecida con éxito",
              "data": null
            }
            """)
        }

        if path.hasSuffix("/auth/app/resident/me") && method == "GET" {
            return (200, """
            {
              "success": true,
              "data": {
                "resident": {
                  "id": "res_demo_001",
                  "property_id": "prop_olivos_101",
                  "first_name": "Carlos",
                  "last_name": "Mendoza",
                  "email": "carlos.mendoza@gmail.com",
                  "phone": "+52 81 8123 4567",
                  "role": "RESIDENT",
                  "is_primary": true,
                  "is_active": true
                },
                "tenantSlug": "demo"
              }
            }
            """)
        }

        if path.hasSuffix("/auth/app/resident/notices") && method == "GET" {
            return (200, """
            {
              "success": true,
              "data": [
                {
                  "id": "not_001",
                  "title": "Mantenimiento General de Alberca",
                  "content": "Estimados residentes, los días lunes y martes se dará servicio a las bombas.",
                  "created_at": "2026-10-01T12:00:00Z"
                },
                {
                  "id": "not_002",
                  "title": "Asamblea Ordinaria Anual",
                  "content": "Se convoca a todos los propietarios a la asamblea en la casa club.",
                  "created_at": "2026-09-28T18:30:00Z"
                }
              ]
            }
            """)
        }

        if path.hasSuffix("/auth/app/resident/invitations") && method == "GET" {
            return (200, """
            {
              "success": true,
              "data": [
                {
                  "id": "inv_001",
                  "visitor_name": "Juan Pérez",
                  "pass_type": "VISITOR",
                  "valid_from": "2026-10-02T08:00:00Z",
                  "valid_until": "2026-10-02T23:59:59Z",
                  "status": "ACTIVE"
                }
              ]
            }
            """)
        }

        if path.hasSuffix("/auth/app/resident/invitations") && method == "POST" {
            return (201, """
            {
              "success": true,
              "data": {
                "id": "inv_002",
                "visitor_name": "Visita Creada Mock",
                "pass_type": "VISITOR",
                "valid_from": "2026-10-02T16:00:00Z",
                "valid_until": "2026-10-03T16:00:00Z",
                "status": "ACTIVE"
              }
            }
            """)
        }

        if path.contains("/auth/app/resident/invitations/") && method == "DELETE" {
            return (200, """
            {
              "success": true,
              "message": "Invitación revocada exitosamente",
              "data": null
            }
            """)
        }

        if path.hasSuffix("/auth/app/resident/access-credential") && method == "GET" {
            return (200, """
            {
              "success": true,
              "data": {
                "code": "DOMMIA-9921",
                "payload": "dommia://qr/pass/demo-resident-token-9921",
                "stepExpiresAt": "2026-10-02T23:59:59Z"
              }
            }
            """)
        }

        if path.hasSuffix("/auth/app/resident/finance/status") && method == "GET" {
            return (200, """
            {
              "success": true,
              "data": {
                "propertyId": "prop_olivos_101",
                "totalBalanceDue": 0.0,
                "hasPendingCharges": false,
                "pendingChargesCount": 0
              }
            }
            """)
        }

        if path.hasSuffix("/auth/app/resident/finance/campaigns") && method == "GET" {
            return (200, """
            {
              "success": true,
              "data": [
                {
                  "id": "camp_001",
                  "name": "Mantenimiento Octubre 2026",
                  "status": "ACTIVE"
                }
              ]
            }
            """)
        }

        if path.hasSuffix("/auth/app/resident/finance/monthly-reports") && method == "GET" {
            return (200, """
            {
              "success": true,
              "data": []
            }
            """)
        }

        return (200, """
        {
          "success": true,
          "message": "Endpoint mock OK",
          "data": null
        }
        """)
    }
}
