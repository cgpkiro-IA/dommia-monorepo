import SwiftUI

public struct ResidentTopBar: View {
    public let tenantSlug: String
    public let onLogout: () -> Void

    public init(tenantSlug: String, onLogout: @escaping () -> Void) {
        self.tenantSlug = tenantSlug
        self.onLogout = onLogout
    }

    public var body: some View {
        HStack(spacing: 12) {
            // Brand Logo & Name
            HStack(spacing: 8) {
                ZStack {
                    RoundedRectangle(cornerRadius: 10, style: .continuous)
                        .fill(DommiaTheme.primaryBlue)
                        .frame(width: 32, height: 32)

                    Image(systemName: "shield.fill")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(.white)
                }

                HStack(spacing: 4) {
                    Text("DOMMIA")
                        .font(.system(size: 15, weight: .black))
                        .foregroundStyle(.white)

                    Text("Resident")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(DommiaTheme.primaryBlue)
                }
            }

            Spacer()

            // Tenant badge
            HStack(spacing: 5) {
                Circle()
                    .fill(DommiaTheme.emerald)
                    .frame(width: 6, height: 6)

                Text(tenantSlug.uppercased())
                    .font(.system(size: 10, weight: .black))
                    .tracking(1)
                    .foregroundStyle(DommiaTheme.textSecondary)
            }
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(DommiaTheme.surface)
            .clipShape(Capsule())
            .overlay(Capsule().stroke(DommiaTheme.border, lineWidth: 1))

            // Logout Button
            Button(action: onLogout) {
                Image(systemName: "rectangle.portrait.and.arrow.right")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(DommiaTheme.textMuted)
                    .frame(width: 36, height: 36)
                    .background(DommiaTheme.surface)
                    .clipShape(Circle())
                    .overlay(Circle().stroke(DommiaTheme.border, lineWidth: 1))
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(DommiaTheme.surface.opacity(0.95))
        .overlay(
            Rectangle()
                .frame(height: 1)
                .foregroundStyle(DommiaTheme.border),
            alignment: .bottom
        )
    }
}
