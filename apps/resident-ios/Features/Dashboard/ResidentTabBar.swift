import SwiftUI

public enum ResidentTabKey: String, CaseIterable {
    case credential = "credential"
    case passes = "passes"
    case notices = "notices"
    case finance = "finance"

    public var title: String {
        switch self {
        case .credential: return "Mi Credencial"
        case .passes: return "Pases Visita"
        case .notices: return "Circulares"
        case .finance: return "Mis Cuotas"
        }
    }

    public var iconName: String {
        switch self {
        case .credential: return "qrcode"
        case .passes: return "person.badge.plus"
        case .notices: return "bell.fill"
        case .finance: return "creditcard.fill"
        }
    }
}

public struct ResidentTabBar: View {
    @Binding public var activeTab: ResidentTabKey
    public var noticesCount: Int

    public init(activeTab: Binding<ResidentTabKey>, noticesCount: Int = 2) {
        self._activeTab = activeTab
        self.noticesCount = noticesCount
    }

    public var body: some View {
        HStack(spacing: 0) {
            ForEach(ResidentTabKey.allCases, id: \.self) { tab in
                let isActive = activeTab == tab

                Button {
                    activeTab = tab
                } label: {
                    VStack(spacing: 4) {
                        ZStack(alignment: .topTrailing) {
                            Image(systemName: tab.iconName)
                                .font(.system(size: 20, weight: isActive ? .bold : .medium))
                                .foregroundStyle(isActive ? DommiaTheme.primaryBlue : DommiaTheme.textMuted)
                                .scaleEffect(isActive ? 1.05 : 1.0)

                            if tab == .notices && noticesCount > 0 && !isActive {
                                Circle()
                                    .fill(DommiaTheme.primaryBlue)
                                    .frame(width: 8, height: 8)
                                    .offset(x: 4, y: -2)
                            }
                        }

                        Text(tab.title)
                            .font(.system(size: 10, weight: isActive ? .bold : .medium))
                            .foregroundStyle(isActive ? DommiaTheme.primaryBlue : DommiaTheme.textMuted)
                            .lineLimit(1)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 8)
        .padding(.bottom, 6)
        .background(DommiaTheme.surface.opacity(0.97))
        .overlay(
            Rectangle()
                .frame(height: 1)
                .foregroundStyle(DommiaTheme.border),
            alignment: .top
        )
    }
}
