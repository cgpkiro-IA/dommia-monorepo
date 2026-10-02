import Foundation
import Security

public final class KeychainStore: @unchecked Sendable {
    private let service: String
    private static let lock = NSLock()
    private static var inMemoryFallback: [String: String] = [:]

    public init(service: String = "com.dommia.resident") {
        self.service = service
    }

    public func save(_ value: String, account: String) throws {
        let data = Data(value.utf8)
        let query = baseQuery(account: account)
        SecItemDelete(query as CFDictionary)
        var item = query
        item[kSecValueData as String] = data
        item[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlock
        let status = SecItemAdd(item as CFDictionary, nil)

        if status == -34018 || status == errSecNotAvailable {
            // Fallback en memoria para entorno de pruebas / simulador sin entitlement host
            Self.lock.lock()
            defer { Self.lock.unlock() }
            Self.inMemoryFallback["\(service):\(account)"] = value
            return
        }

        guard status == errSecSuccess else { throw KeychainError.status(status) }
    }

    public func read(account: String) throws -> String? {
        var query = baseQuery(account: account)
        query[kSecReturnData as String] = true
        query[kSecMatchLimit as String] = kSecMatchLimitOne
        var result: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        if status == -34018 || status == errSecNotAvailable {
            Self.lock.lock()
            defer { Self.lock.unlock() }
            return Self.inMemoryFallback["\(service):\(account)"]
        }

        if status == errSecItemNotFound { return nil }
        guard status == errSecSuccess, let data = result as? Data else {
            throw KeychainError.status(status)
        }
        return String(data: data, encoding: .utf8)
    }

    public func delete(account: String) throws {
        Self.lock.lock()
        Self.inMemoryFallback.removeValue(forKey: "\(service):\(account)")
        Self.lock.unlock()

        let status = SecItemDelete(baseQuery(account: account) as CFDictionary)
        if status == -34018 || status == errSecNotAvailable { return }
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw KeychainError.status(status)
        }
    }

    private func baseQuery(account: String) -> [String: Any] {
        [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
        ]
    }
}

public enum KeychainError: Error, Sendable {
    case status(OSStatus)
}
