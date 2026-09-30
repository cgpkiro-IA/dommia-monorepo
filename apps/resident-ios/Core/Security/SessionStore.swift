import Foundation

public actor SessionStore {
    public private(set) var accessToken: String?
    private let keychain: KeychainStore
    private let refreshAccount = "resident.refresh-token"

    public init(keychain: KeychainStore = KeychainStore()) {
        self.keychain = keychain
    }

    public func restore() throws {
        accessToken = nil
    }

    public func refreshToken() throws -> String? {
        try keychain.read(account: refreshAccount)
    }

    public func save(accessToken: String, refreshToken: String) throws {
        try keychain.save(refreshToken, account: refreshAccount)
        self.accessToken = accessToken
    }

    public func update(accessToken: String, refreshToken: String) throws {
        try save(accessToken: accessToken, refreshToken: refreshToken)
    }

    public func clear() throws {
        accessToken = nil
        try keychain.delete(account: refreshAccount)
    }
}
