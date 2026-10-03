import SwiftUI

/// Sistema de diseño unificado de DOMMIA Resident.
/// Replicado con exactitud desde resident-pwa y resident-android.
public enum DommiaTheme {
    // MARK: - Colors
    public static let canvas = Color(red: 0.031, green: 0.067, blue: 0.122) // #08111F
    public static let surface = Color(red: 0.059, green: 0.090, blue: 0.165) // #0F172A
    public static let surfaceCard = Color(red: 0.071, green: 0.106, blue: 0.188)
    public static let border = Color(red: 0.118, green: 0.161, blue: 0.231) // #1E293B
    public static let borderLight = Color(red: 0.200, green: 0.255, blue: 0.333) // #334155
    public static let inputBackground = Color(red: 0.008, green: 0.024, blue: 0.090) // #020617

    // Accents
    public static let primaryBlue = Color(red: 0.231, green: 0.510, blue: 0.965) // #3B82F6
    public static let blueLight = Color(red: 0.576, green: 0.773, blue: 0.992) // #93C5FD
    public static let blueBadge = Color(red: 0.231, green: 0.510, blue: 0.965).opacity(0.15)

    public static let emerald = Color(red: 0.063, green: 0.725, blue: 0.506) // #10B981
    public static let emeraldLight = Color(red: 0.431, green: 0.906, blue: 0.718) // #6EE7B7
    public static let emeraldBadge = Color(red: 0.063, green: 0.725, blue: 0.506).opacity(0.15)
    public static let emeraldDark = Color(red: 0.024, green: 0.306, blue: 0.231) // #064E3B

    public static let danger = Color(red: 0.937, green: 0.267, blue: 0.267) // #EF4444
    public static let dangerDark = Color(red: 0.271, green: 0.039, blue: 0.039) // #450A0A

    // Text
    public static let textPrimary = Color.white
    public static let textSecondary = Color(red: 0.796, green: 0.835, blue: 0.882) // #CBD5E1
    public static let textMuted = Color(red: 0.580, green: 0.639, blue: 0.722) // #94A3B8
    public static let placeholder = Color(red: 0.278, green: 0.333, blue: 0.412) // #475569

    // Gradients
    public static let residentCardGradient = LinearGradient(
        colors: [
            Color(red: 0.118, green: 0.161, blue: 0.231), // #1E293B
            Color(red: 0.059, green: 0.090, blue: 0.165), // #0F172A
            Color(red: 0.008, green: 0.024, blue: 0.090)  // #020617
        ],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    public static let primaryButtonGradient = LinearGradient(
        colors: [
            Color(red: 0.231, green: 0.510, blue: 0.965), // #3B82F6
            Color(red: 0.149, green: 0.384, blue: 0.898)  // #2563EB
        ],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
}

// Custom ViewModifiers for Consistent Design
public struct DommiaCardModifier: ViewModifier {
    public var cornerRadius: CGFloat = 24

    public func body(content: Content) -> some View {
        content
            .background(DommiaTheme.surface)
            .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .stroke(DommiaTheme.border, lineWidth: 1)
            )
            .shadow(color: Color.black.opacity(0.4), radius: 16, x: 0, y: 8)
    }
}

public struct DommiaTextFieldModifier: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
            .background(DommiaTheme.inputBackground)
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .stroke(DommiaTheme.borderLight, lineWidth: 1)
            )
            .foregroundStyle(DommiaTheme.textPrimary)
            .font(.system(size: 15, weight: .regular))
    }
}

public extension View {
    func dommiaCard(cornerRadius: CGFloat = 24) -> some View {
        modifier(DommiaCardModifier(cornerRadius: cornerRadius))
    }

    func dommiaTextField() -> some View {
        modifier(DommiaTextFieldModifier())
    }
}
