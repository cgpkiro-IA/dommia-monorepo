import XCTest
@testable import DommiaResident

final class ResidentFlowTests: XCTestCase {
    @MainActor
    func testAuthAndServicesIntegration() async throws {
        let deps = AppDependencies()
        let vm = LoginViewModel(authRepository: deps.auth)
        vm.fillDemoCredentials()
        await vm.login()
        XCTAssertTrue(vm.isAuthenticated)
        XCTAssertNil(vm.errorMessage)

        let profile = try await deps.profile.me()
        XCTAssertEqual(profile.resident.firstName, "Carlos")
        XCTAssertEqual(profile.tenantSlug, "demo")

        let notices = try await deps.notices.list()
        XCTAssertFalse(notices.isEmpty)

        let passes = try await deps.invitations.list()
        XCTAssertFalse(passes.isEmpty)

        let credential = try await deps.access.credential()
        XCTAssertNotNil(credential.code)

        let finance = try await deps.finance.status()
        XCTAssertEqual(finance.totalBalanceDue, 0.0)
    }
}
