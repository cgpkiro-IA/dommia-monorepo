import SwiftUI

@main
struct DommiaResidentApp: App {
    @State private var dependencies = AppDependencies()

    var body: some Scene {
        WindowGroup {
            AppRoot(dependencies: dependencies)
        }
        #if DEV
        // Nota: En DEV, AppDependencies usa MockServer (MockURLProtocol) para simular el backend.
        #endif
    }
}
