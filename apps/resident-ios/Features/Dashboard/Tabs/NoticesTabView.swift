import SwiftUI

public struct NoticesTabView: View {
    public let noticesService: NoticesService
    @State private var notices: [ResidentNotice] = []
    @State private var isLoading = false
    @State private var selectedNotice: ResidentNotice?
    @State private var filterCategory = "TODAS"

    public init(noticesService: NoticesService) {
        self.noticesService = noticesService
    }

    public var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Header
                VStack(alignment: .leading, spacing: 2) {
                    Text("Circulares y Avisos")
                        .font(.system(size: 22, weight: .black))
                        .foregroundStyle(.white)

                    Text("Comunicados oficiales de la administración")
                        .font(.system(size: 13))
                        .foregroundStyle(DommiaTheme.textMuted)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 16)
                .padding(.top, 16)

                // Category Chips
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        categoryChip("TODAS")
                        categoryChip("MANTENIMIENTO")
                        categoryChip("ASAMBLEAS")
                        categoryChip("SEGURIDAD")
                    }
                    .padding(.horizontal, 16)
                }

                // Notices Feed
                if isLoading && notices.isEmpty {
                    ProgressView().tint(.white).padding(40)
                } else if notices.isEmpty {
                    VStack(spacing: 12) {
                        Image(systemName: "bell.slash.fill")
                            .font(.system(size: 40))
                            .foregroundStyle(DommiaTheme.textMuted)

                        Text("No hay avisos recientes")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundStyle(.white)

                        Text("Cuando la administración publique circulares aparecerán aquí.")
                            .font(.system(size: 13))
                            .foregroundStyle(DommiaTheme.textMuted)
                    }
                    .padding(32)
                    .frame(maxWidth: .infinity)
                    .dommiaCard(cornerRadius: 20)
                    .padding(.horizontal, 16)
                } else {
                    VStack(spacing: 12) {
                        ForEach(notices) { notice in
                            noticeCard(notice)
                        }
                    }
                    .padding(.horizontal, 16)
                }

                Spacer(minLength: 24)
            }
        }
        .task {
            await loadNotices()
        }
        .sheet(item: $selectedNotice) { notice in
            NoticeDetailSheetView(notice: notice)
        }
    }

    private func categoryChip(_ name: String) -> some View {
        let isSelected = filterCategory == name
        return Button {
            filterCategory = name
        } label: {
            Text(name)
                .font(.system(size: 11, weight: .bold))
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(isSelected ? DommiaTheme.primaryBlue : DommiaTheme.surface)
                .clipShape(Capsule())
                .foregroundStyle(isSelected ? .white : DommiaTheme.textMuted)
                .overlay(Capsule().stroke(isSelected ? Color.clear : DommiaTheme.border, lineWidth: 1))
        }
        .buttonStyle(.plain)
    }

    private func noticeCard(_ notice: ResidentNotice) -> some View {
        Button {
            selectedNotice = notice
        } label: {
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    HStack(spacing: 5) {
                        Circle()
                            .fill(Color.orange)
                            .frame(width: 6, height: 6)

                        Text("OFICIAL")
                            .font(.system(size: 9, weight: .black))
                            .foregroundStyle(Color.orange)
                    }
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(Color.orange.opacity(0.12))
                    .clipShape(Capsule())

                    Spacer()

                    Text("Hace 1 día")
                        .font(.system(size: 11))
                        .foregroundStyle(DommiaTheme.textMuted)
                }

                Text(notice.title)
                    .font(.system(size: 16, weight: .black))
                    .foregroundStyle(.white)
                    .multilineTextAlignment(.leading)

                Text(notice.content)
                    .font(.system(size: 13))
                    .foregroundStyle(DommiaTheme.textSecondary)
                    .lineLimit(2)
                    .multilineTextAlignment(.leading)

                HStack {
                    Text("Leer comunicado completo ›")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(DommiaTheme.blueLight)

                    Spacer()
                }
                .padding(.top, 2)
            }
            .padding(16)
            .dommiaCard(cornerRadius: 20)
        }
        .buttonStyle(.plain)
    }

    private func loadNotices() async {
        isLoading = true
        defer { isLoading = false }
        if let list = try? await noticesService.list() {
            notices = list
        }
    }
}

struct NoticeDetailSheetView: View {
    @Environment(\.dismiss) private var dismiss
    public let notice: ResidentNotice

    var body: some View {
        NavigationStack {
            ZStack {
                DommiaTheme.canvas
                    .ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: 18) {
                        HStack {
                            Text("COMUNICADO OFICIAL")
                                .font(.system(size: 10, weight: .black))
                                .padding(.horizontal, 8)
                                .padding(.vertical, 3)
                                .background(Color.orange.opacity(0.15))
                                .clipShape(Capsule())
                                .foregroundStyle(Color.orange)

                            Spacer()

                            Text("Comité de Administración")
                                .font(.system(size: 12))
                                .foregroundStyle(DommiaTheme.textMuted)
                        }

                        Text(notice.title)
                            .font(.system(size: 22, weight: .black))
                            .foregroundStyle(.white)

                        Divider().background(DommiaTheme.border)

                        Text(notice.content)
                            .font(.system(size: 15))
                            .foregroundStyle(DommiaTheme.textSecondary)
                            .lineSpacing(6)

                        Spacer()
                    }
                    .padding(24)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cerrar") { dismiss() }
                        .foregroundStyle(DommiaTheme.blueLight)
                }
            }
        }
    }
}
