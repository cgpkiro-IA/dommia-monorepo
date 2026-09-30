import Foundation

public actor AuthSessionCoordinator {
    private let client: APIClient
    private let store: SessionStore
    private var refreshTask: Task<String, Error>?

    public init(client: APIClient, store: SessionStore) {
        self.client = client
        self.store = store
    }

    public func accessToken() async throws -> String {
        if let accessToken = await store.accessToken {
            return accessToken
        }
        return try await refresh()
    }

    public func refresh() async throws -> String {
        if let refreshTask { return try await refreshTask.value }
        let task = Task { () throws -> String in
            defer { Task { await self.clearRefreshTask() } }
            guard let refreshToken = try await store.refreshToken() else {
                throw APIError.missingSession
            }
            let response: APIEnvelope<ResidentAppLoginData> = try await client.send(
                path: "auth/app/resident/refresh",
                method: "POST",
                body: ResidentAppRefreshRequest(refreshToken: refreshToken)
            )
            guard let data = response.data, let accessToken = data.accessToken, let nextRefreshToken = data.refreshToken else {
                throw APIError.decoding("La respuesta de refresh no contiene tokens.")
            }
            try await store.update(accessToken: accessToken, refreshToken: nextRefreshToken)
            return accessToken
        }
        refreshTask = task
        return try await task.value
    }

    public func clear() async {
        try? await store.clear()
        refreshTask = nil
    }

    private func clearRefreshTask() {
        refreshTask = nil
    }
}
