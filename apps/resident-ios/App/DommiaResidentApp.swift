import SwiftUI

@main
struct DommiaResidentApp: App {
    @State private var dependencies = AppDependencies()

    var body: some Scene {
        WindowGroup {
            AppRoot(dependencies: dependencies)
        }
    }
}
