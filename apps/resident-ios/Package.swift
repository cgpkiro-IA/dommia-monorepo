// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "DommiaResidentCore",
    platforms: [.iOS(.v17)],
    products: [
        .library(name: "DommiaResidentCore", targets: ["DommiaResidentCore"]),
    ],
    targets: [
        .target(
            name: "DommiaResidentCore",
            path: "Core"
        ),
        .testTarget(
            name: "DommiaResidentCoreTests",
            dependencies: ["DommiaResidentCore"],
            path: "Tests"
        ),
    ]
)
